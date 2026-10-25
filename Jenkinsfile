pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        AWS_REGION     = 'us-east-1'
        BACKEND_REPO   = 'cloudnative-backend'
        FRONTEND_REPO  = 'cloudnative-frontend'
        VITE_WS_URL    = 'ws://k8s-collabsu-collabsu-f9e7369d20-115437088.us-east-1.elb.amazonaws.com/'
        VITE_API_URL   = '/api'
        TRIVY_VERSION  = '0.72.0'
        GITOPS_REPO    = 'github.com/HassanTaiwo185/aws-eks-self-healing-cicd-platform.git'
    }

    stages {

        // Jenkins' own manifest-update commits carry [skip ci]; don't rebuild for them
        stage('Check Trigger') {
            steps {
                script {
                    def msg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    env.SKIP_CI = msg.contains('[skip ci]') ? 'true' : 'false'
                    if (env.SKIP_CI == 'true') {
                        echo 'Commit is a GitOps manifest update from Jenkins: skipping pipeline.'
                        currentBuild.result = 'NOT_BUILT'
                    }
                }
            }
        }

        stage('Build') {
            when { expression { env.SKIP_CI == 'false' } }
            steps {
                script {
                    def sha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    // Build number + commit SHA: unique even if the same commit is rebuilt
                    // (ECR tags are IMMUTABLE)
                    env.IMAGE_TAG = "${BUILD_NUMBER}-${sha}"
                }
                sh '''
                    BUST=$(date +%Y-%m-%d)

                    docker build --pull --platform linux/amd64 \
                      --build-arg APT_CACHE_BUST=$BUST \
                      -t ${BACKEND_REPO}:${IMAGE_TAG} ./app/backend

                    docker build --pull --platform linux/amd64 \
                      --build-arg APK_CACHE_BUST=$BUST \
                      --build-arg VITE_API_URL=${VITE_API_URL} \
                      --build-arg VITE_WS_URL=${VITE_WS_URL} \
                      -t ${FRONTEND_REPO}:${IMAGE_TAG} ./app/frontend

                '''
            }
        }

        stage('Unit Tests') {
            when { expression { env.SKIP_CI == 'false' } }
            environment {
                NET           = "ci-${BUILD_NUMBER}"
                PG            = "pg-${BUILD_NUMBER}"
                REDIS         = "redis-${BUILD_NUMBER}"
                BREVO_API_KEY = credentials('brevo-api-key')
            }
            steps {
                sh '''
                    docker network create $NET

                    docker run -d --name $PG --network $NET \
                      -e POSTGRES_DB=collaboration_db \
                      -e POSTGRES_USER=postgres \
                      -e POSTGRES_PASSWORD=postgres \
                      postgres:16-alpine

                    docker run -d --name $REDIS --network $NET redis:7-alpine

                    until docker exec $PG pg_isready -U postgres; do sleep 1; done

                    docker run --rm --network $NET \
                      -e SECRET_KEY=ci-throwaway-key \
                      -e DEBUG=False \
                      -e FRONTEND_URL=http://localhost:5173 \
                      -e REDIS_URL=redis://$REDIS:6379/0 \
                      -e CELERY_BROKER_URL=redis://$REDIS:6379/0 \
                      -e DB_NAME=collaboration_db \
                      -e DB_USER=postgres \
                      -e DB_PASSWORD=postgres \
                      -e DB_HOST=$PG \
                      -e DB_PORT=5432 \
                      -e BREVO_API_KEY \
                      ${BACKEND_REPO}:${IMAGE_TAG} python manage.py test
                '''
            }
            post {
                always {
                    sh '''
                        docker rm -f $PG $REDIS || true
                        docker network rm $NET || true
                    '''
                }
            }
        }
        

        stage('Trivy Scan') {
            when { expression { env.SKIP_CI == 'false' } }
            steps {
                sh '''
                    for IMAGE in ${BACKEND_REPO} ${FRONTEND_REPO}; do
                      CID=$(docker create \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v trivy-cache:/root/.cache/ \
                        aquasec/trivy:${TRIVY_VERSION} image \
                        --timeout 15m \
                        --exit-code 1 \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --ignorefile /tmp/.trivyignore \
                        ${IMAGE}:${IMAGE_TAG})

                      docker cp .trivyignore $CID:/tmp/.trivyignore

                      RC=0
                      docker start -a $CID || RC=$?
                      docker rm $CID > /dev/null
                      [ "$RC" -eq 0 ] || exit $RC
                    done
                '''
            }
        }



        stage('ECR Login') {
            when { expression { env.SKIP_CI == 'false' } }
            agent {
                docker {
                    image 'amazon/aws-cli:2.15.0'
                    reuseNode true
                    args "--entrypoint=''"
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'my_aws',
                                                  usernameVariable: 'AWS_ACCESS_KEY_ID',
                                                  passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh 'aws ecr get-login-password --region $AWS_REGION > .ecr-token'
                }
            }
        }

        stage('Push to ECR') {
            when { expression { env.SKIP_CI == 'false' } }
            environment {
                AWS_ACCOUNT_ID = credentials('aws-account-id')
            }
            steps {
                sh '''
                    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

                    docker login --username AWS --password-stdin $ECR_REGISTRY < .ecr-token
                    rm -f .ecr-token

                    for REPO in $BACKEND_REPO $FRONTEND_REPO; do
                      docker tag  $REPO:$IMAGE_TAG $ECR_REGISTRY/$REPO:$IMAGE_TAG
                      docker push $ECR_REGISTRY/$REPO:$IMAGE_TAG
                    done
                '''
            }
            post {
                always {
                    sh 'docker logout "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com" || true'
                }
            }
        }

        // GitOps hand-off: commit the new image tags; Argo CD syncs them to EKS
        stage('Update GitOps Manifests') {
            when { expression { env.SKIP_CI == 'false' } }
            environment {
                AWS_ACCOUNT_ID = credentials('aws-account-id')
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token',
                                                  usernameVariable: 'GIT_USER',
                                                  passwordVariable: 'GIT_TOKEN')]) {
                    sh '''
                        ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

                        git config user.name  "Jenkins CI"
                        git config user.email "jenkins@ci.local"

                        # Work on the latest main (Jenkins checks out a detached HEAD)
                        git fetch origin main
                        git checkout -B main origin/main

                        # Point every manifest that uses each image at the new tag
                        
                        for REPO in $BACKEND_REPO $FRONTEND_REPO; do
                          docker run --rm --user "$(id -u):$(id -g)" \
                           -v "$PWD/k8s:/work" -w /work/overlays/prod \
                            registry.k8s.io/kustomize/kustomize:v5.4.3 \
                             edit set image "$ECR_REGISTRY/$REPO=$ECR_REGISTRY/$REPO:$IMAGE_TAG"
                        done


                        git add k8s/
                        if git diff --cached --quiet; then
                          echo "No manifest changes to commit."
                        else
                          git commit -m "ci: deploy ${IMAGE_TAG} [skip ci]"
                          git push "https://${GIT_USER}:${GIT_TOKEN}@${GITOPS_REPO}" main
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                rm -f .ecr-token
                docker image rm ${BACKEND_REPO}:${IMAGE_TAG} ${FRONTEND_REPO}:${IMAGE_TAG} 2>/dev/null || true
            '''
        }
    }
}