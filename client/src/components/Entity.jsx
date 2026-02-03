import { useState } from "react";
import Modal from "./Modal";
import { isImage } from "../utils/commonUtil";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { isExpired } from "../licenseGuard";
export default function Entity(props) {
  const navigate = useNavigate();
  let [flagDeleteButtonPressed, setFlagDeleteButtonPressed] = useState(false);
  let [showExportDropdown, setShowExportDropdown] = useState(false);
  let [showCustomerMenu, setShowCustomerMenu] = useState(false);
  let [showCompanyMenu, setShowCompanyMenu] = useState(false);
  let [showEnquiryMenu, setShowEnquiryMenu] = useState(false);
  let [showMeasurementMenu, setShowMeasurementMenu] = useState(false);
  let { entity } = props;
  let { showInList } = props;
  let { cntShow } = props;
  let { sortedField } = props;
  let { direction } = props;
  let { index } = props;
  let { listSize } = props;
  let { selectedEntity } = props;
  let { VITE_API_URL } = props;
  function handleEditButtonClick() {
    props.onEditButtonClick(entity);
  }
  // Removed debug logs to reduce console clutter
  // useEffect(() => {
  //   if (selectedEntity && selectedEntity.name === "Customers") {
  //     console.log("Customer Entity Debug:", {
  //       selectedEntityName: selectedEntity.name,
  //       onNavigateToEntity: props.onNavigateToEntity,
  //       entityId: entity?._id,
  //       entityName: entity?.name,
  //       enquiryCount: entity?.enquiryCount
  //     });
  //   }
  //   if (selectedEntity && selectedEntity.name === "Measurements") {
  //     console.log("Measurement Entity Debug:", {
  //       selectedEntityName: selectedEntity.name,
  //       onNavigateToEntity: props.onNavigateToEntity,
  //       onCreateQuotationClick: props.onCreateQuotationClick,
  //       entityId: entity?._id,
  //       entityExists: !!entity,
  //       quotationCount: entity?.quotationCount,
  //       linkShouldShow: selectedEntity && selectedEntity.name === "Measurements" && props.onNavigateToEntity && entity && entity._id
  //     });
  //   }
  // }, [selectedEntity, entity, props.onNavigateToEntity, props.onCreateQuotationClick]);
  function handleDeleteButtonClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFlagDeleteButtonPressed(true);
  }
  function handleModalCloseClick() {
    setFlagDeleteButtonPressed(false);
  }
  function handleModalButtonClick(ans) {
    setFlagDeleteButtonPressed(false);
    props.onDeleteButtonClick(ans, entity);
  }
  function handleToggleText(index) {
    props.onToggleText(index);
  }
  
  function getEntityDisplayName() {
    // Try to find the best identifier for the entity
    if (entity.name) {
      return entity.name;
    }
    if (entity.code) {
      return entity.code;
    }
    if (entity.customer) {
      return entity.customer;
    }
    if (entity.enquiry) {
      return entity.enquiry;
    }
    // Fallback to entity type or index
    return selectedEntity?.singularName || "this record";
  }
  
  // if (isExpired()) {
  //   return null;
  // }
  return (
    <>
      <div className="row entity-card mx-auto my-1 align-items-center">
        <div className="col-12 col-sm-1 entity-index text-muted fw-semibold mb-0 mb-sm-0">
          {sortedField == "updateDate" && !direction
            ? index + 1
            : listSize - index}
          .
        </div>
        {showInList.map(
          (e, index) =>
            e.show && (
              <div
                key={index}
                className={
                  cntShow >= 4 ? "col-2" : cntShow == 3 ? "col-3" : cntShow == 2 ? "col-6" : "col-5"
                }
              >
                <div className="entity-field text-truncate">
                  {(() => {
                    const fieldValue = entity[e.attribute];
                    
                    // CRITICAL: Check for arrays FIRST - never render arrays as normal values
                    if (Array.isArray(fieldValue)) {
                      if (e.attribute === "products") {
                        return (
                          <div>
                            {fieldValue.length > 0 ? (
                              <span 
                                className="badge bg-info me-1"
                                style={{ cursor: "pointer" }}
                                onClick={(event) => {
                                  event.preventDefault();
                                  if (props.onProductsClick) {
                                    props.onProductsClick(entity);
                                  }
                                }}
                                title="Click to view product details"
                              >
                                {fieldValue.length} {fieldValue.length === 1 ? "product" : "products"}
                              </span>
                            ) : (
                              <span className="text-muted">No products</span>
                            )}
                          </div>
                        );
                      }
                      return <span className="text-muted">[{fieldValue.length} items]</span>;
                    }
                    
                    // CRITICAL: Check for objects SECOND - never render objects directly
                    if (fieldValue != null && typeof fieldValue === "object" && !(fieldValue instanceof Date) && !Array.isArray(fieldValue)) {
                      return <span className="text-muted">[Object]</span>;
                    }
                    
                    // Handle singleFile type
                    if (e.type == "singleFile") {
                      if ((e.allowedFileType == "image" || (e.allowedFileType == "all" && isImage(fieldValue))) && fieldValue) {
                        return (
                          <img
                            className="img-fluid"
                            src={VITE_API_URL + "/api/uploadedImages/" + fieldValue}
                            alt="Unavailable"
                          />
                        );
                      }
                      if (e.allowedFileType == "all" && !isImage(fieldValue) && fieldValue) {
                        return (
                          <a
                            href="#"
                            onClick={() => {
                              handleShowNonImgFileClick(fieldValue);
                            }}
                          >
                            {String(fieldValue).slice(0, 10)}...{String(fieldValue).slice(String(fieldValue).length - 5)}
                          </a>
                        );
                      }
                      return null;
                    }
                    
                    // Handle text-area type
                    if (e.type == "text-area") {
                      if (selectedEntity && selectedEntity.name === "Companies" && e.attribute === "description") {
                        return <span>{fieldValue || ""}</span>;
                      }
                      return (
                        <>
                          {e.flagReadMore && fieldValue}
                          {!e.flagReadMore && fieldValue && String(fieldValue).slice(0, 50)}
                          <button
                            className="btn btn-link p-0 ms-1 entity-readmore-btn"
                            onClick={() => {
                              handleToggleText(index);
                            }}
                          >
                            Read {e.flagReadMore ? "Less" : "More"}
                          </button>
                        </>
                      );
                    }
                    
                    // Handle normal type fields
                    if (e.type == "normal") {
                      if (e.attribute === "customer" && entity.customerId) {
                        return (
                          <a
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              if (props.onCustomerClick) {
                                props.onCustomerClick(entity.customerId);
                              }
                            }}
                            style={{ color: "#0d6efd", textDecoration: "none" }}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                          >
                            {fieldValue}
                          </a>
                        );
                      }
                      if (e.attribute === "status") {
                        return (
                          <span className={`status-badge status-badge-${String(fieldValue)?.toLowerCase() || 'default'}`}>
                            {fieldValue}
                          </span>
                        );
                      }
                      // For company name, check if it appears duplicated and fix it
                      if (selectedEntity && selectedEntity.name === "Companies" && e.attribute === "name") {
                        const nameValue = String(fieldValue || "");
                        const halfLength = Math.floor(nameValue.length / 2);
                        if (halfLength > 0 && nameValue.substring(0, halfLength) === nameValue.substring(halfLength)) {
                          return <span>{nameValue.substring(0, halfLength)}</span>;
                        }
                        return <span>{nameValue}</span>;
                      }
                      // Default: render as string (only if it's a primitive value)
                      if (fieldValue != null && (typeof fieldValue !== "object" || fieldValue instanceof Date)) {
                        return <span>{String(fieldValue)}</span>;
                      }
                    }
                    
                    // Fallback: if nothing matched, return null
                    return null;
                  })()}
                </div>
              </div>
            )
        )}

        {/* Edit, Delete, Save, and Discard buttons */}
        <div className="col-12 col-sm-auto text-end entity-actions mt-1 mt-sm-0">
          <div className="d-flex flex-nowrap justify-content-end gap-2" style={{ gap: "0.5rem" }}>
            {props.isEditing ? (
              <>
                {props.onSaveClick && (
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (props.onSaveClick) {
                        props.onSaveClick(entity);
                      }
                    }}
                    title="Save changes"
                  >
                    <i className="bi bi-check-circle"></i>
                  </button>
                )}
                {props.onDiscardClick && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (props.onDiscardClick) {
                        props.onDiscardClick();
                      }
                    }}
                    title="Discard changes"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </>
            ) : (
              <>
                {selectedEntity.editFacility && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleEditButtonClick}
                    title="Edit"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                )}
                {selectedEntity.deleteFacility && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteButtonClick(e);
                    }}
                    title="Delete"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                )}
                {/* Show Quotation button - for all Quotations (including curtain and accessories types) */}
                {selectedEntity.name === "Quotations" && props.onShowQuotationClick && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (props.onShowQuotationClick) {
                        props.onShowQuotationClick(entity);
                      }
                    }}
                    title="Show Quotation"
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                )}
                {/* Customer menu dropdown - only for Customers */}
                {selectedEntity.name === "Customers" && props.onNavigateToEntity && (
                  <div className="position-relative" style={{ display: "inline-block" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCustomerMenu(!showCustomerMenu);
                      }}
                      title="More options"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {showCustomerMenu && (
                      <>
                        <div
                          className="position-fixed"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1040
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCustomerMenu(false);
                          }}
                        ></div>
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1050,
                            minWidth: "180px",
                            marginTop: "0.25rem"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowCustomerMenu(false);
                              if (props.onNavigateToEntity && props.customerId) {
                                props.onNavigateToEntity("Enquiries", { 
                                  customerId: props.customerId,
                                  customerName: props.customerName,
                                  customerWhatsappNumber: props.customerWhatsappNumber
                                });
                              }
                            }}
                          >
                            <i className="bi bi-inbox me-2"></i>Enquiries
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Company menu dropdown - only for Companies */}
                {selectedEntity.name === "Companies" && props.onNavigateToEntity && (
                  <div className="position-relative" style={{ display: "inline-block" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCompanyMenu(!showCompanyMenu);
                      }}
                      title="More options"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {showCompanyMenu && (
                      <>
                        <div
                          className="position-fixed"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1040
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCompanyMenu(false);
                          }}
                        ></div>
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1050,
                            minWidth: "180px",
                            marginTop: "0.25rem"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowCompanyMenu(false);
                              const companyId = props.companyId || entity._id;
                              const companyName = props.companyName || entity.name;
                              if (props.onNavigateToEntity && companyId) {
                                props.onNavigateToEntity("Catalogs", { 
                                  companyId: companyId,
                                  companyName: companyName
                                });
                              } else if (companyId) {
                                // Fallback: navigate directly using react-router
                                navigate("/catalogs", { 
                                  state: { 
                                    filterParams: {
                                      companyId: companyId,
                                      companyName: companyName
                                    }
                                  } 
                                });
                              }
                            }}
                          >
                            <i className="bi bi-book me-2"></i>Catalogs
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Enquiry menu dropdown - only for Enquiries */}
                {selectedEntity.name === "Enquiries" && props.onNavigateToEntity && (
                  <div className="position-relative" style={{ display: "inline-block" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEnquiryMenu(!showEnquiryMenu);
                      }}
                      title="More options"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {showEnquiryMenu && (
                      <>
                        <div
                          className="position-fixed"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1040
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowEnquiryMenu(false);
                          }}
                        ></div>
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1050,
                            minWidth: "180px",
                            marginTop: "0.25rem"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowEnquiryMenu(false);
                              if (props.onNavigateToEntity && entity._id) {
                                // Extract customer name and WhatsApp from enquiry.customer field
                                const customerName = entity.customer ? entity.customer.split(' (')[0] : "";
                                const customerWhatsappNumber = entity.customerWhatsappNumber || "";
                                props.onNavigateToEntity("Measurements", { 
                                  enquiryId: entity._id,
                                  enquiryCode: entity.code || "",
                                  customerName: customerName,
                                  customerWhatsappNumber: customerWhatsappNumber
                                });
                              }
                            }}
                          >
                            <i className="bi bi-rulers me-2"></i>Measurements
                          </a>
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowEnquiryMenu(false);
                              if (props.onNavigateToEntity && entity._id) {
                                // Extract customer name and WhatsApp from enquiry.customer field
                                const customerName = entity.customer ? entity.customer.split(' (')[0] : "";
                                const customerWhatsappNumber = entity.customerWhatsappNumber || "";
                                props.onNavigateToEntity("Quotations", { 
                                  enquiryId: entity._id,
                                  enquiryCode: entity.code || "",
                                  customerName: customerName,
                                  customerWhatsappNumber: customerWhatsappNumber
                                });
                              }
                            }}
                          >
                            <i className="bi bi-file-text me-2"></i>Quotations
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Measurement menu dropdown - only for Measurements */}
                {selectedEntity.name === "Measurements" && (props.onNavigateToEntity || props.onCreateQuotationClick) && (
                  <div className="position-relative" style={{ display: "inline-block" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMeasurementMenu(!showMeasurementMenu);
                      }}
                      title="More options"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {showMeasurementMenu && (
                      <>
                        <div
                          className="position-fixed"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1040
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMeasurementMenu(false);
                          }}
                        ></div>
                        <div
                          className="dropdown-menu show"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1050,
                            minWidth: "180px",
                            marginTop: "0.25rem"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {/* {props.onCreateQuotationClick && (
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMeasurementMenu(false);
                                if (props.onCreateQuotationClick) {
                                  props.onCreateQuotationClick(entity);
                                }
                              }}
                            >
                              <i className="bi bi-file-text me-2"></i>Create Quotation
                            </a>
                          )} */}
                          {props.onCreateMeasurementListClick && (
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMeasurementMenu(false);
                                if (props.onCreateMeasurementListClick) {
                                  props.onCreateMeasurementListClick(entity);
                                }
                              }}
                            >
                              <i className="bi bi-list-ul me-2"></i>Create Measurement List
                            </a>
                          )}
                          {!props.onCreateQuotationClick && !props.onCreateMeasurementListClick && (
                            <span className="dropdown-item-text text-muted px-3 py-2" style={{ fontSize: "0.875rem" }}>
                              No actions available
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* WhatsApp button - separate column */}
        {props.customerWhatsappNumber && props.onWhatsAppClick && (
          <div className="col-12 col-sm-auto text-start text-sm-end entity-actions mt-1 mt-sm-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onWhatsAppClick(props.customerWhatsappNumber);
              }}
              title="Message on WhatsApp"
            >
              <i className="bi bi-whatsapp"></i>
            </button>
          </div>
        )}
        <div className="col-12 entity-footer mt-1 pt-1">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-muted"></i>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              {(() => {
                // Check if record was actually updated (updateDate differs from addDate)
                const addDate = entity.addDate ? new Date(entity.addDate).getTime() : null;
                const updateDate = entity.updateDate ? new Date(entity.updateDate).getTime() : null;
                const wasUpdated = addDate && updateDate && updateDate !== addDate;
                
                if (wasUpdated) {
                  // Record was updated - show update info
                  return (
                    <>
                      Last updated by {entity.updatedBy || "N/A"} on{" "}
                      {new Date(entity.updateDate).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </>
                  );
                } else {
                  // Record was never updated - show add info
                  const displayDate = entity.addDate || entity.updateDate;
                  const addedBy = entity.addedBy || entity.updatedBy || "N/A";
                  // Check if record was added through Excel import
                  if (addedBy === "Excel Import" || addedBy === "N/A") {
                    return (
                      <>
                        Data added through excel on{" "}
                        {displayDate ? new Date(displayDate).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        }) : "N/A"}
                      </>
                    );
                  }
                  return (
                    <>
                      Last added by {addedBy} on{" "}
                      {displayDate ? new Date(displayDate).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      }) : "N/A"}
                    </>
                  );
                }
              })()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Enquiries link for Customers - separate row */}
      {selectedEntity && selectedEntity.name === "Customers" && entity && entity._id && (
        <div className="row mx-auto mb-2">
          <div className="col-12">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (props.onNavigateToEntity && entity._id) {
                  props.onNavigateToEntity("Enquiries", { 
                    customerId: entity._id,
                    customerName: entity.name || props.customerName,
                    customerWhatsappNumber: entity.whatsappNumber || props.customerWhatsappNumber
                  });
                } else {
                  console.error("onNavigateToEntity is not available");
                }
              }}
              className="btn btn-sm btn-outline-info"
              style={{ textDecoration: "none" }}
              title="View enquiries for this customer"
            >
              <i className="bi bi-inbox me-1"></i>
              Enquiries ({entity.enquiryCount !== undefined && entity.enquiryCount !== null ? entity.enquiryCount : 0})
            </a>
          </div>
        </div>
      )}
      
      {/* Measurements link for Enquiries - separate row */}
      {selectedEntity.name === "Enquiries" && props.onNavigateToEntity && entity.measurementCount !== undefined && (
        <div className="row mx-auto mb-2">
          <div className="col-12">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (props.onNavigateToEntity && props.enquiryId) {
                  // Extract customer name and WhatsApp from enquiry.customer field
                  const customerName = props.customerName || (entity.customer ? entity.customer.split(' (')[0] : "");
                  const customerWhatsappNumber = props.customerWhatsappNumberForMenu || "";
                  props.onNavigateToEntity("Measurements", { 
                    enquiryId: props.enquiryId,
                    enquiryCode: props.enquiryCode || entity.code || "",
                    customerName: customerName,
                    customerWhatsappNumber: customerWhatsappNumber
                  });
                }
              }}
              className="btn btn-sm btn-outline-info"
              style={{ textDecoration: "none" }}
              title="View measurements for this enquiry"
            >
              <i className="bi bi-rulers me-1"></i>
              {entity.measurementCount} {entity.measurementCount === 1 ? "measurement" : "measurements"}
            </a>
          </div>
        </div>
      )}
      
      {/* Quotations link for Measurements - separate row */}
      {selectedEntity && selectedEntity.name === "Measurements" && entity && entity._id && (
        <div className="row mx-auto mb-2">
          <div className="col-12">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (props.onNavigateToEntity && entity._id) {
                  // Extract enquiry information from measurement
                  const enquiryDisplayName = entity.enquiry || "";
                  props.onNavigateToEntity("Quotations", { 
                    measurementId: entity._id,
                    enquiryDisplayName: enquiryDisplayName
                  });
                } else {
                  console.error("onNavigateToEntity is not available");
                }
              }}
              className="btn btn-sm btn-outline-info"
              style={{ textDecoration: "none" }}
              title="View quotations for this measurement"
            >
              <i className="bi bi-file-text me-1"></i>
              quotations ({entity.quotationCount !== undefined && entity.quotationCount !== null ? entity.quotationCount : 0})
            </a>
          </div>
        </div>
      )}
      
      {/* Catalogs link for Companies - separate row */}
      {selectedEntity && selectedEntity.name === "Companies" && entity && entity._id && (
        <div className="row mx-auto mb-2">
          <div className="col-12">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (props.onNavigateToEntity && entity._id) {
                  props.onNavigateToEntity("Catalogs", { 
                    companyId: entity._id,
                    companyName: entity.name || props.companyName
                  });
                } else if (entity._id) {
                  // Fallback: navigate directly using react-router
                  navigate("/catalogs", { 
                    state: { 
                      filterParams: {
                        companyId: entity._id,
                        companyName: entity.name || props.companyName
                      }
                    } 
                  });
                } else {
                  console.error("onNavigateToEntity is not available and entity._id is missing");
                }
              }}
              className="btn btn-sm btn-outline-info"
              style={{ textDecoration: "none" }}
              title="View catalogs for this company"
            >
              <i className="bi bi-book me-1"></i>
              Catalogs ({entity.catalogCount !== undefined && entity.catalogCount !== null ? entity.catalogCount : 0})
            </a>
          </div>
        </div>
      )}
      
      {flagDeleteButtonPressed && (
        <Modal
          heading="Confirm Delete"
          modalText={
            'Do you really want to delete "' + getEntityDisplayName() + '"? This action cannot be undone.'
          }
          btnGroup={["Yes", "No"]}
          onModalCloseClick={handleModalCloseClick}
          onModalButtonClick={handleModalButtonClick}
        />
      )}
    </>
  );
}
