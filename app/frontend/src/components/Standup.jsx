import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // <-- ADD THIS
import StandupPage from "./StandupPage";
import api from "../api";
import CreateStandup from "./CreateStandup";

const Standup = () => {
  const [standupList, setStandupList] = useState([]);
  const [toggle, setToggle] = useState(0);
  const [error, setError] = useState("");
  const location = useLocation(); // <-- GET CURRENT PATH

  const handleCreateStandup = () => {
    setToggle((prev) => prev + 1);
  };

  const fetchStandupList = async () => {
    try {
      const response = await api.get("standups/list");
      if (response.status === 200) {
        setStandupList(response.data.length === 0 ? [] : response.data);
      }
    } catch (error) {
      if (error.response?.status === 401) setError(error.response.data);
    }
  };

  useEffect(() => {
    fetchStandupList();
  }, [toggle]);

    // condition to render create standup form
  const isCreateStandupsRoute = location.pathname === "/createstandups"; 

  return (
    <>
      {error && <p>{error}</p>}
      <StandupPage standupList={standupList} setStandupList={setStandupList} />
      {isCreateStandupsRoute && (
        <CreateStandup onCreate={handleCreateStandup} />
      )}
    </>
  );
};

export default Standup;
