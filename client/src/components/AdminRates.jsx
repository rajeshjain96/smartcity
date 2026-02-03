import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminRateForm from "./AdminRateForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import { getEmptyObject } from "../utils/commonUtil";

export default function AdminRates(props) {
  const navigate = useNavigate();
  const selectedEntity = {
    name: "Rates",
    singularName: "Rate",
    dbCollection: "rates",
    addFacility: false,
    deleteFacility: false,
    editFacility: true,
    accessLevel: "A",
  };
  let [rateList, setRateList] = useState([]);
  let [action, setAction] = useState("list");
  let [rateToBeEdited, setRateToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [message, setMessage] = useState("");
  let { flagFormInvalid } = props;
  let { user: loggedInUser } = props;
  let { onBackButtonClick } = props;
  // AP/Roman rates schema
  let apRomanRateSchema=[
    {attribute:"perPlateStitchingRate",type:"normal",label:"Per Plate Stitching Rate (AP)",},
    {attribute:"perSqFtStitchingRate",type:"normal",label:"Per sq.ft.stitching rate(Roman)",},
    {attribute:"astarStitchingRate",type:"normal",label:"Astar Stitching Rate",},
    {attribute:"trackRatePerRunningFeet",type:"normal",label:"Track Rate (per running feet)",},
  ]
  // Blinds rates schema
  let blindsRateSchema=[
    {attribute:"customisedBlindRate",type:"normal",label:"Customised (per sq. ft.)",},
    {attribute:"fabricBlindRate",type:"normal",label:"Fabric Blind (per sq. ft.)",},
    {attribute:"ecoBlackoutBlindRate",type:"normal",label:"Eco-Blackout (per sq. ft.)",},
    {attribute:"verticalBlindRate",type:"normal",label:"Vertical (per sq. ft.)",},
    {attribute:"zebraBlindRate",type:"normal",label:"Zebra (per sq. ft.)",},
  ]
  // Combined schema for empty object generation
  let rateSchema = [...apRomanRateSchema, ...blindsRateSchema];
  
  let rateValidations={
    perPlateStitchingRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    perSqFtStitchingRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    astarStitchingRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    trackRatePerRunningFeet:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    customisedBlindRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    fabricBlindRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    ecoBlackoutBlindRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    verticalBlindRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
    zebraBlindRate:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
  }
  let [emptyRate, setEmptyRate] = useState(getEmptyObject(rateSchema));
  useEffect(() => {
    getData();
  }, []);
  async function getData() {
      setFlagLoad(true);
      try {
        let response = await axios("/rates");
        let pList = await response.data;
        pList = pList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setRateList(pList);
        
        // If no record exists, automatically show add form
        // If one record exists, show it in update mode directly
        if (pList.length === 0) {
          setAction("add");
          setRateToBeEdited("");
        } else if (pList.length === 1) {
          // One record exists, show form directly in update mode
          setAction("update");
          setRateToBeEdited(pList[0]);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Oops! An error occurred. Refresh the page");
        }
      }
      setFlagLoad(false);
    }
  async function handleFormSubmit(rate) {
    let message;
    let rateForBackEnd = { ...rate };
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/rates",
          rateForBackEnd
        );
        let addedRate = await response.data;
        message = "Rates added successfully";
        setRateList([addedRate]);
        setRateToBeEdited(addedRate);
        showMessage(message);
        setAction("update"); // Switch to update mode after adding
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
      }
      setFlagLoad(false);
    } else if (action == "update") {
      rateForBackEnd._id = rateToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/rates",
          rateForBackEnd
        );
        let updatedRate = await response.data;
        message = "Rates updated successfully";
        setRateList([updatedRate]);
        setRateToBeEdited(updatedRate);
        showMessage(message);
        // Navigate to dashboard after successful update
        if (onBackButtonClick) {
          setTimeout(() => {
            onBackButtonClick();
          }, 500); // Small delay to show success message
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
      }
      setFlagLoad(false);
    }
  }
  function handleFormCloseClick() {
    // Navigate to dashboard when cancel is clicked
    if (onBackButtonClick) {
      onBackButtonClick();
    } else {
      getData(); // Fallback: Re-fetch and display the form
    }
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
      {/* Fixed Navbar */}
      <nav className="admin-page-navbar">
        <div className="admin-page-navbar-container">
          <button
            className="admin-page-navbar-back-btn"
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <i className="bi bi-arrow-left me-2"></i>
            <span className="admin-page-navbar-back-text">Back to Home</span>
          </button>
          <div className="admin-page-navbar-title">
            <span className="admin-page-navbar-page-name">Rates</span>
          </div>
          <div style={{ width: '120px' }}></div> {/* Spacer for alignment */}
        </div>
      </nav>
      
      {/* Content with padding for navbar */}
      <div className="container admin-page-content-wrapper">
      {message && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}
      {(action == "add" || action == "update") && (
        <div className="row">
          <AdminRateForm
            apRomanRateSchema={apRomanRateSchema}
            blindsRateSchema={blindsRateSchema}
            rateValidations={rateValidations}
            emptyRate={emptyRate}
            selectedEntity={selectedEntity}
            rateToBeEdited={rateToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            loggedInUser={loggedInUser}
          />
        </div>
      )}
      </div>
    </>
  );
}
