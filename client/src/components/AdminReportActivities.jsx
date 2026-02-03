import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// import AdminReportCumulativeList from "./admin-report-cumulative-list";
import axios from "axios";

export default function AdminReportActivities(props) {
  let [flagLoad, setFlagLoad] = useState(false);
  let [message, setMessage] = useState("");
  let [error, setError] = useState("");
  let [fileContent, setFileContent] = useState("");
  let [whichDate, setWhichDate] = useState("Today");
  let [selectedDate, setSelectedDate] = useState(new Date());
  let [twoDaysAgoDate, setTwoDaysAgoDate] = useState(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return twoDaysAgo;
  });
  let { flagToggleButton } = props;
  let { selectedEntity } = props;

  function handleDateSelection(value) {
    setWhichDate(value);
    // setFlagDisplay(false);
    if (value == "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(yesterday);
    } else if (value == "Today") {
      setSelectedDate(new Date());
    } else if (value == "Other Date") {
      setSelectedDate(twoDaysAgoDate);
    }
  }

  function formatDate(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  async function handleShowHereClick() {
    let fileName = "activity-" + formatDate(selectedDate) + ".log";
    setFileContent("");
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL + "/api/files/showActivityLog/" + fileName,
        {
          responseType: "text",
        }
      );
      setFileContent(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        showMessage("File is not present");
      } else {
        showMessage("Failed to fetch file content");
      }
    }
  }
  async function handleDownloadClick() {
    //activity-2025-05-17.log
    let fileName = "activity-" + formatDate(selectedDate) + ".log";
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL + "/api/files/downloadActivityLog/" + fileName,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage("File Downloaded");
    } catch (error) {
      try {
        if (error.response?.status === 404) {
          showMessage("File is not present");
        } else {
          showMessage("Failed to download file");
        }
      } catch (err) {
        showMessage("Unexpected error occurred");
      }
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  let d = new Date();
  let content = (
    // This is enclosed in container-list-table
    <>
      {/* row starts */}
      <h4
        className={
          "text-center text-primary  " +
          (flagToggleButton ? "" : "w-75 mx-auto")
        }
        style={{ margin: "0px" }}
      >
        {selectedEntity.name}
      </h4>
      <h6
        className={
          "text-center text-primary  " +
          (flagToggleButton ? "" : "w-75 mx-auto")
        }
        style={{ margin: "0px" }}
      >
        ( {formatDate(selectedDate)} )
      </h6>
      {message && <div className="text-center text-danger my-2">{message}</div>}
      {/* row ends */}
      {/* row starts */}
      <div className="text-center my-3 w-50 mx-auto  p-2 border border-2 ">
        <input
          type="radio"
          className="form-control-inline"
          name="whichDate"
          value="Today"
          onClick={() => handleDateSelection("Today")}
          onChange={() => handleDateSelection("Today")}
          checked={whichDate === "Today"}
        />
        &nbsp;Today{" "}
        <input
          type="radio"
          className="form-control-inline"
          name="whichDate"
          value="Yesterday"
          onClick={() => handleDateSelection("Yesterday")}
          onChange={() => handleDateSelection("Yesterday")}
        />
        &nbsp;Yesterday{" "}
        <input
          type="radio"
          className="form-control-inline"
          name="whichDate"
          value="Other Date"
          onClick={() => handleDateSelection("Other Date")}
          onChange={() => handleDateSelection("Other Date")}
          checked={whichDate === "Other Date"}
        />
        &nbsp;Other Date:
        <div className=" my-2 text-center ">
          {whichDate === "Other Date" && (
            <div className="">
              <div className="my-2">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  selectsEnd
                  //   startDate={fromDate}
                  //   endDate={toDate}
                  //   minDate={fromDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <button className="btn btn-primary" onClick={handleShowHereClick}>
          Show Here
        </button>{" "}
        <button className="btn btn-primary" onClick={handleDownloadClick}>
          Download
        </button>
      </div>
      <div>
        {fileContent && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              marginTop: "20px",
              borderRadius: "4px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {fileContent}
          </pre>
        )}
      </div>
      {flagLoad && (
        <div className="text-center mt-5">
          <LoadingSpinner size={40} />
        </div>
      )}
    </>
  );
  if (error) {
    return <div>Error retriving Cumulative </div>;
  } else {
    return (
      // <div className="container-fluid bg-blue">
      // <div className="row">
      <div className="container-fluid container-list-table p-0">{content}</div>
      // </div>
      // </div>
    );
  } //else
}
