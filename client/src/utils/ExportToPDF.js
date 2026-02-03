import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportToPDF(
  selectedEntityName,
  fieldsToBeExported,
  exportList,
  fileName,
  addDate = null,
  updateDate = null
) {
  try {
    const data = [...exportList];
    let headers = [];
    
    // Helper function to format products array as readable string, grouped by place
    function formatProductsForExport(products) {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return "";
      }
      
      // Group products by place
      const groupedByPlace = {};
      products.forEach((product) => {
        const place = product.place || "Unspecified";
        if (!groupedByPlace[place]) {
          groupedByPlace[place] = [];
        }
        groupedByPlace[place].push(product);
      });
      
      // Sort places alphabetically (or keep original order)
      const sortedPlaces = Object.keys(groupedByPlace).sort();
      
      // Format products placewise
      const formattedSections = sortedPlaces.map((place) => {
        const placeProducts = groupedByPlace[place];
        const placeHeader = `--- ${place} ---`;
        const productLines = placeProducts.map((product) => {
          let parts = [];
          if (product.productName) parts.push(product.productName);
          
          let dimensions = [];
          if (product.height !== undefined && product.height !== "") dimensions.push(`H:${product.height}`);
          if (product.width !== undefined && product.width !== "") dimensions.push(`W:${product.width}`);
          if (product.length !== undefined && product.length !== "") dimensions.push(`L:${product.length}`);
          
          if (dimensions.length > 0) {
            parts.push(`(${dimensions.join(", ")})`);
          }
          
          return parts.join(" ");
        });
        
        return [placeHeader, ...productLines].join("\n");
      });
      
      return formattedSections.join("\n\n");
    }

    // Process body data with null/undefined handling
    let body = data.map((row, index) => {
      let a = [];
      for (let i = 0; i < fieldsToBeExported.length; i++) {
        const fieldName = fieldsToBeExported[i];
        let value = row[fieldName];
        
        // Format products array if it exists in the original data
        // Check if this is the products field and if the original data has products array
        if (fieldName === "products" && Array.isArray(value)) {
          value = formatProductsForExport(value);
        }
        
        // Handle null, undefined, or empty values
        if (value === null || value === undefined || value === "") {
          a.push("");
        } else {
          a.push(String(value));
        }
      }
      return a;
    });
    
    // Make first letter of headers capital
    fieldsToBeExported = fieldsToBeExported.map((e) => {
      if (!e) return "";
      let s = e.charAt(0).toUpperCase() + e.slice(1);
      return s;
    });
    // now push to headers
    headers.push(fieldsToBeExported);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add header content
    doc.setFontSize(20);
    doc.text(selectedEntityName + " Data", 40, 50);
    doc.setFontSize(14);
    let yPos = 75;
    doc.text("Generated on: " + new Date().toLocaleDateString(), 40, yPos);
    
    // Add Add Date and Update Date if provided (for single measurement record)
    if (addDate || updateDate) {
      yPos += 20;
      if (addDate) {
        doc.text("Add Date: " + addDate, 40, yPos);
        yPos += 20;
      }
      if (updateDate) {
        doc.text("Update Date: " + updateDate, 40, yPos);
        yPos += 20;
      }
    }

    // Try to add logo (optional, won't block PDF generation)
    const logo = new Image();
    logo.src = "/images/Mobico_Logo.png";
    
    // Function to add table and save PDF
    const addTableAndSave = () => {
      // Calculate startY based on whether dates are shown
      const startY = (addDate || updateDate) ? (100 + (addDate ? 20 : 0) + (updateDate ? 20 : 0)) : 100;
      
      autoTable(doc, {
        head: headers,
        body: body,
        startY: startY,
        theme: "grid",
        headStyles: { 
          fillColor: [0, 102, 204], 
          textColor: 255,
          fontSize: 14,
          cellPadding: 10,
          lineWidth: 0.5
        },
        bodyStyles: { 
          fillColor: [245, 245, 245],
          fontSize: 12,
          cellPadding: 10,
          lineWidth: 0.5
        },
        alternateRowStyles: { 
          fillColor: [255, 255, 255],
          fontSize: 12,
          cellPadding: 10
        },
        styles: { 
          fontSize: 12, 
          cellPadding: 10,
          lineWidth: 0.5,
          lineColor: [200, 200, 200]
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(10);
          doc.text(
            `Page ${
              doc.internal.getCurrentPageInfo().pageNumber
            } of ${pageCount}`,
            pageWidth - 100,
            pageHeight - 20
          );
        },
      });
      
      // Clean up file name (remove invalid characters and ensure .pdf extension)
      let cleanFileName = fileName.replace(/[<>:"/\\|?*]/g, "_");
      if (!cleanFileName.endsWith(".pdf")) {
        cleanFileName += ".pdf";
      }
      doc.save(cleanFileName);
    };

    // Flag to track if PDF has been saved
    let pdfSaved = false;
    
    // Function to add table and save PDF (with guard to prevent double-saving)
    const addTableAndSaveOnce = () => {
      if (pdfSaved) return;
      pdfSaved = true;
      addTableAndSave();
    };

    // Try to add logo, but proceed with PDF generation regardless
    logo.onload = () => {
      try {
        doc.addImage(logo, "JPEG", pageWidth - 140, 20, 100, 50);
      } catch (err) {
        console.warn("Could not add logo to PDF:", err);
      }
      addTableAndSaveOnce();
    };
    
    logo.onerror = () => {
      // Logo failed to load, proceed without it
      console.warn("Logo failed to load, proceeding without logo");
      addTableAndSaveOnce();
    };
    
    // Set a timeout to ensure PDF is generated even if logo callbacks don't fire
    setTimeout(() => {
      addTableAndSaveOnce();
    }, 2000);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error generating PDF: " + error.message);
  }
}
