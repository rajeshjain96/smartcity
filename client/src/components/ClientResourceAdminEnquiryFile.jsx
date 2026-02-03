import axios from "axios";
import { useEffect, useState } from "react";
// import { getFileExtension, isImage } from "../external/vite-sdk";
import { getFileExtension, isImage } from "../utils/commonUtil";
import LoadingSpinner from "./LoadingSpinner";
export default function ClientResourceAdminEnquiryFile(props) {
  let { id } = props;
  let { fileId } = props;
  let [flagLoad, setFlagLoad] = useState(false);
  let [message, setMessage] = useState("");
  let [resourceFileInfo, setResourceFileInfo] = useState({});

  useEffect(() => {
    getData();
  }, []);
  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios(
        import.meta.env.VITE_API_URL +
          "/api/resources/enquiryFile/" +
          id +
          "/" +
          fileId
      );
      let rFileInfo = response.data;
      if (rFileInfo == "Unauthorized") {
        showMessage("Session over. Login again");
      } else {
        setResourceFileInfo(rFileInfo);
      }
    } catch (error) {
      console.log(error);
      showMessage("Something went wrong, refresh the page");
    }
    setFlagLoad(false);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  if (flagLoad) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }
  return (
    <>
      <h6>{message}</h6>;
      <h2 className="text-center">{resourceFileInfo.description}</h2>
      {/* <h2 className="text-center">{isImage(resourceFileInfo.resourceFile)}</h2> */}
      {isImage(resourceFileInfo.resourceFile) && (
        <h2 className="text-center">
          <img
            src={
              import.meta.env.VITE_API_URL +
              "/api/uploadedImages/" +
              resourceFileInfo.resourceFile
            }
            alt=""
          />
        </h2>
      )}
      {!isImage(resourceFileInfo.resourceFile) && (
        <h2 className="text-center">
          Get the {getFileExtension(resourceFileInfo.resourceFile)} File{" "}
          <a
            href={
              import.meta.env.VITE_API_URL +
              "/api/uploadedImages/" +
              resourceFileInfo.resourceFile
            }
          >
            Here
          </a>
        </h2>
      )}
    </>
  );
}
