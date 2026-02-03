import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import InfoHeader from "./InfoHeader";
// import { formatToIST } from "../external/vite-sdk";
import { formatToIST } from "../utils/commonUtil";

export default function Resources() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const product = params.get("product");
  const user = params.get("user");
  let [flagLoad, setFlagLoad] = useState(false);
  let [message, setMessage] = useState("");
  let [enquiry, setEnquiry] = useState([]);
  let [remark, setRemark] = useState("");
  useEffect(() => {
    getData();
  }, []);
  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios(
        import.meta.env.VITE_API_URL + "/api/enquiries/" + id
      );
      let enq = await response.data;
      if (enq == "Unauthorized") {
        setMessage("Session over. Login again");
      } else {
        setEnquiry(enq);
        document.title = enq.name;
      }
    } catch (error) {
      setMessage("Something went wrong, refresh the page");
    }
    setFlagLoad(false);
  }
  function handleWhatsappClick() {
    let message = "";
    let url =
      `https://api.whatsapp.com/send?phone=${enquiry.mobileNumber}&text=` +
      message;
    window.open(url, "_blank");
  }
  async function handleFormSubmit(event) {
    event.preventDefault();
    setFlagLoad(true);
    try {
      let response = await axios.post(
        import.meta.env.VITE_API_URL + "/api/enquiries/" + id + "/remarks",
        { remark: remark, user: user }
      );
      let r = await response.data;
      let re = [...enquiry.remarks];
      re.push({ remark: remark, addDate: new Date(), user: user });
      setEnquiry({ ...enquiry, remarks: re });
      setRemark("");
    } catch (error) {
      setMessage("Something went wrong, refresh the page");
    }
    setFlagLoad(false);
  }
  function handleTextAreaChange(event) {
    setRemark(event.target.value);
  }
  if (flagLoad) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }
  if (message) {
    return (
      <div className="my-5 text-center text-danger">
        Session over. Please login again.
      </div>
    );
  }
  return (
    <>
      <InfoHeader
        product={product}
        enquiry={enquiry}
        onWhatsappClick={handleWhatsappClick}
      />
      <div className="container enquiry-remarks">
        <form onSubmit={handleFormSubmit}>
          <div className="row">
            <div className="col-8">
              <textarea
                cols="40"
                rows="5"
                style={{ resize: "none", padding: "5px" }}
                name="remark"
                value={remark}
                id=""
                placeholder="Add remark here"
                onChange={handleTextAreaChange}
              ></textarea>
            </div>
            <div className="col-2">
              <button className="btn btn-primary" type="submit">
                Add
              </button>
            </div>
          </div>
        </form>
        <div className="container">
          {enquiry.remarks && (
            <div className="row ">
              {enquiry.remarks
                .slice()
                .reverse()
                .map((e, index) => (
                  <div key={index}>
                    <div className="text-bigger lh-1">{e.remark}</div>
                    <div className="text-small text-italic mb-1">
                      {e.user} ({formatToIST(e.addDate)})
                    </div>
                    <div></div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
