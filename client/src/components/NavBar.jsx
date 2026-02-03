import { useEffect, useState } from "react";
import axios from "axios";

export default function NavBar(props) {
  const imageFileName = "mobico";
  let [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    getCountOfImageFiles();
  }, []);
  async function getCountOfImageFiles() {
    let response = await axios.get(
      import.meta.env.VITE_API_URL + "/api/files/count/" + imageFileName
    );
    let fc = response.data.count;
    setFileCount(fc);
  }
  function handleSignInClick() {}
  return (
    <div className="text-center">
      <button className="btn btn-primary" onClick={handleSignInClick}>
        Sign In
      </button>
    </div>
  );
}
