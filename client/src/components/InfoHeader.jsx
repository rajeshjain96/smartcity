// import { formatToIST } from "../external/vite-sdk";
import { formatToIST } from "../utils/commonUtil";

export default function InfoHeader(props) {
  let { enquiry } = props;
  let { message } = props;
  function handleWhatsappClick() {
    let message = "";
    let url =
      `https://api.whatsapp.com/send?phone=${enquiry.mobileNumber}&text=` +
      message;
    window.open(url, "_blank");
  }
  return (
    <div className="container fixed-top bg-primary text-white p-2">
      <div className="row  border-bottom border-1 border-primary justify-content-center align-items-center">
        <div className="col-8">
          <div className="row">
            <div className="col-4 text-end">
              <span className="">Product Interested In: </span>
            </div>
            <div className="col-8">
              <span className="">{enquiry.product}</span>
            </div>
            <div className="col-4 text-end">
              <span className="">Customer Name: </span>
            </div>
            <div className="col-8">
              <span className="">
                {enquiry.name} ({enquiry.mobileNumber})
              </span>
            </div>
            <div className="col-4 text-end">
              <span className="">Location: </span>
            </div>
            <div className="col-8">
              <span className="">
                {enquiry.siteLocation} ({enquiry.city} - {enquiry.region}).
              </span>
            </div>
            <div className="col-4 text-end">
              <span className="">Start-date:</span>
            </div>
            <div className="col-8">
              <span className="">{formatToIST(enquiry.addDate)}</span>
            </div>
          </div>
        </div>
        {/* //row ends */}
        <div className="col-2">
          <span onClick={handleWhatsappClick}>
            <i
              className="bi bi-whatsapp"
              style={{ fontSize: "2rem", color: "#25D366" }}
            ></i>
          </span>
        </div>
      </div>
      {/* row ends */}
      {/* <div className="text-center bg-white text-danger">{message}</div> */}
    </div>
    // container ends
  );
}
