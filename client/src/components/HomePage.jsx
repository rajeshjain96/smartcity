import { useEffect, useState } from "react";
import axios from "axios";
export default function HomePage(props) {
  const imageFileName = "mobico";
  let [fileCount, setFileCount] = useState(0);
  let { user } = props;
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
  function handleLoginSignupClick() {
    props.onLoginSignupClick();
  }
  return (
    <>
      {user && (
        <div className="text-center text-primary">
          <div>Welcome {user.name || user.emailId}</div>
          {user.shopurl && user.role && (
            <div className="text-muted small mt-1">
              {user.shopurl} ({user.role})
            </div>
          )}
        </div>
      )}
      {!user && (
        <div className="text-center text-primary my-3">
          <a href="#" onClick={handleLoginSignupClick}>
            Login / Signup
          </a>
        </div>
      )}
      <div className="w-50 mx-auto my-1">
        <div
          id="carouselExampleAutoplaying"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-inner">
            {new Array(fileCount).fill(0).map((e, index) => (
              <div className="carousel-item active" key={index}>
                <img
                  src={
                    import.meta.env.VITE_API_URL +
                    "/api/uploadedImages/" +
                    imageFileName +
                    (index + 1) +
                    ".jpg"
                  }
                  className="d-block w-100"
                  alt="..."
                />
              </div>
            ))}
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleAutoplaying"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleAutoplaying"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    </>
  );
}