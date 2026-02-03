import jsPDF from "jspdf";

export default async function ExportQuotationToPDF(quotation, catalogList, ratesData, shopDetails, isCustomisedRates = false, apiUrl = null) {
  try {
    console.log("📄 Starting PDF generation");
    console.log("🏪 Shop details:", shopDetails ? "Present" : "Missing");
    if (shopDetails) {
      console.log("🏪 Shop logo filename:", shopDetails.logo);
      console.log("🏪 Shop name:", shopDetails.shopName);
    }
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 20;
    const sectionSpacing = 30;
    
    // Header height - will be calculated based on content
    let headerHeight = 80;
    let startY = headerHeight + 20; // Start content below header

    // Helper function to get catalog price (returns integer)
    function getCatalogPrice(catalogId) {
      if (!catalogId || !catalogList) return 0;
      const catalog = catalogList.find(c => c._id === catalogId);
      return catalog && catalog.priceInRs ? Math.round(parseFloat(catalog.priceInRs)) : 0;
    }

    // Helper function to get rates
    function getRates() {
      // Use the ratesData parameter passed to this function (could be standard or customised rates)
      const rates = ratesData || {};
      return {
        astarStitchingRate: rates.astarStitchingRate ? Math.round(parseFloat(rates.astarStitchingRate) * 100) / 100 : 0,
        perPlateStitchingRate: rates.perPlateStitchingRate ? Math.round(parseFloat(rates.perPlateStitchingRate) * 100) / 100 : 0,
        perSqFtStitchingRate: rates.perSqFtStitchingRate ? Math.round(parseFloat(rates.perSqFtStitchingRate) * 100) / 100 : 0,
        trackRatePerRunningFeet: rates.trackRatePerRunningFeet ? Math.round(parseFloat(rates.trackRatePerRunningFeet) * 100) / 100 : 0,
        customisedBlindRate: rates.customisedBlindRate ? Math.round(parseFloat(rates.customisedBlindRate)) : 0,
        fabricBlindRate: rates.fabricBlindRate ? Math.round(parseFloat(rates.fabricBlindRate)) : 0,
        ecoBlackoutBlindRate: rates.ecoBlackoutBlindRate ? Math.round(parseFloat(rates.ecoBlackoutBlindRate)) : 0,
        verticalBlindRate: rates.verticalBlindRate ? Math.round(parseFloat(rates.verticalBlindRate)) : 0,
        zebraBlindRate: rates.zebraBlindRate ? Math.round(parseFloat(rates.zebraBlindRate)) : 0
      };
    }

    // Add header with logo and shop details
    const headerY = 20;
    const logoSize = 60;
    const logoX = margin; // Logo on the left side
    const detailsX = pageWidth - margin; // Shop details on the right side
    const detailsMaxWidth = pageWidth - logoX - logoSize - 40; // Max width for shop details
    
    // Load logo asynchronously if available - using fetch API for better reliability
    let logoDataUrl = null;
    
    if (shopDetails && shopDetails.logo) {
      try {
        // Use API URL (server-side port) instead of client-side origin
        const baseUrl = apiUrl || import.meta.env.VITE_API_URL || window.location.origin;
        const logoUrl = `${baseUrl}/api/uploadedImages/${shopDetails.logo}`;
        console.log("🖼️ Loading logo from:", logoUrl);
        
        // Fetch image as blob and convert to base64
        const response = await fetch(logoUrl);
        if (response.ok) {
          const blob = await response.blob();
          console.log("✅ Logo blob received, type:", blob.type);
          
          // Convert blob to base64 data URL
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              logoDataUrl = reader.result;
              console.log("✅ Logo converted to base64, length:", logoDataUrl ? logoDataUrl.length : 0);
              
              // Add to PDF using base64 data URL
              if (logoDataUrl) {
                try {
                  // Determine format from blob type or filename
                  const ext = shopDetails.logo.toLowerCase().split('.').pop();
                  const imageFormat = ext === 'png' ? 'PNG' : 'JPEG';
                  
                  doc.addImage(logoDataUrl, imageFormat, logoX, headerY, logoSize, logoSize);
                  console.log("✅ Logo added to PDF successfully at", logoX, headerY);
                } catch (e) {
                  console.error("❌ Error adding logo to PDF:", e.message);
                  logoDataUrl = null;
                }
              }
              resolve();
            };
            reader.onerror = () => {
              console.error("❌ Error reading logo blob");
              logoDataUrl = null;
              reject(new Error("Failed to read logo blob"));
            };
            reader.readAsDataURL(blob);
          });
        } else {
          console.error("❌ Failed to fetch logo, status:", response.status);
          logoDataUrl = null;
        }
      } catch (error) {
        console.error("❌ Logo loading error:", error);
        logoDataUrl = null;
      }
    } else {
      console.log("ℹ️ No shop details or logo found");
    }
    
    // Add shop details on the right side
    if (shopDetails) {
      let detailY = headerY;
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      
      if (shopDetails.shopName) {
        doc.text(shopDetails.shopName, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
        detailY += lineHeight;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      
      if (shopDetails.address) {
        const addressLines = doc.splitTextToSize(shopDetails.address, detailsMaxWidth);
        doc.text(addressLines, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
        detailY += (addressLines.length * lineHeight);
      }
      
      if (shopDetails.emailId) {
        doc.text(`Email: ${shopDetails.emailId}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
        detailY += lineHeight;
      }
      
      if (shopDetails.mobileNumber) {
        doc.text(`Mobile: ${shopDetails.mobileNumber}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
        detailY += lineHeight;
      }
      
      if (shopDetails.gstNumber) {
        doc.text(`GST: ${shopDetails.gstNumber}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
        detailY += lineHeight;
      }
      
      // Update header height based on actual content
      headerHeight = Math.max(logoSize, detailY - headerY) + 10;
      startY = headerHeight + 20;
    }
    
    // Draw a line below header - double lines if customised rates are used
    doc.setLineWidth(1);
    doc.setDrawColor(0, 0, 0);
    if (isCustomisedRates) {
      // Draw double lines for customised rates
      doc.line(margin, startY - 10, pageWidth - margin, startY - 10);
      doc.line(margin, startY - 8, pageWidth - margin, startY - 8);
      startY += 10;
    } else {
      // Single line for standard rates
      doc.line(margin, startY - 10, pageWidth - margin, startY - 10);
      startY += 10;
    }
    
    // Add today's date below header line
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const dateX = pageWidth - margin; // Right aligned
    doc.text(`Date: ${dateStr}`, dateX, startY, { align: "right" });
    startY += lineHeight + 5; // Add spacing after date
    
    // Add heading: Quotation (curtains) - centered
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Quotation (curtains)", pageWidth / 2, startY, { align: "center" });
    startY += lineHeight + 10; // Add spacing after heading
    
    // Add customer details in one line: Customer Name | Address | WhatsApp Number
    if (quotation.customerName || quotation.address || quotation.whatsappNumber) {
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      
      let customerLine = "";
      if (quotation.customerName) {
        customerLine += quotation.customerName;
      }
      if (quotation.address) {
        if (customerLine) customerLine += " | ";
        customerLine += quotation.address;
      }
      if (quotation.whatsappNumber) {
        if (customerLine) customerLine += " | ";
        customerLine += quotation.whatsappNumber;
      }
      
      if (customerLine) {
        // Split text if too long to fit on one line
        const maxWidth = pageWidth - 2 * margin;
        const textWidth = doc.getTextWidth(customerLine);
        if (textWidth > maxWidth) {
          // Split into multiple lines if needed
          const lines = doc.splitTextToSize(customerLine, maxWidth);
          doc.text(lines, margin, startY);
          startY += (lines.length * lineHeight);
        } else {
          doc.text(customerLine, margin, startY);
          startY += lineHeight;
        }
      }
      
      startY += 10; // Add spacing before products
    }

    // Filter AP and Roman type products
    const curtainProducts = quotation.products.filter(p => p.curtainType === "AP" || p.curtainType === "Roman" || p.curtainType === "Blinds");
    
    if (curtainProducts.length === 0) {
      doc.setFontSize(14);
      // Check if there are products but curtain type is not set
      if (quotation.products && quotation.products.length > 0) {
        doc.text("Select the curtain type first.", margin, startY);
      } else {
        doc.text("No curtain products found in this quotation.", margin, startY);
      }
      doc.save(`Quotation_${quotation.customerName || 'Customer'}.pdf`);
      return;
    }

    // Group products by place
    const groupedByPlace = {};
    curtainProducts.forEach((product) => {
      const place = product.place || "Unspecified";
      if (!groupedByPlace[place]) {
        groupedByPlace[place] = [];
      }
      groupedByPlace[place].push(product);
    });
    
    // Sort places alphabetically
    const sortedPlaces = Object.keys(groupedByPlace).sort();

    const rates = getRates();
    let grandTotal = 0;
    let placeIndex = 1;

    // Helper function to add header (reusable for new pages)
    // Note: logoDataUrl and logoImageFormat are in outer scope
    function addHeader() {
      const headerY = 20;
      const logoSize = 60;
      const logoX = margin; // Logo on the left side
      const detailsX = pageWidth - margin; // Shop details on the right side
      const detailsMaxWidth = pageWidth - logoX - logoSize - 40; // Max width for shop details
      
      // Add logo if we have it (from first page load)
      if (logoDataUrl && shopDetails && shopDetails.logo) {
        try {
          const ext = shopDetails.logo.toLowerCase().split('.').pop();
          const imageFormat = ext === 'png' ? 'PNG' : 'JPEG';
          doc.addImage(logoDataUrl, imageFormat, logoX, headerY, logoSize, logoSize);
        } catch (e) {
          console.warn("Could not add logo on new page:", e);
        }
      }
      
      if (shopDetails) {
        let detailY = headerY;
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        if (shopDetails.shopName) {
          doc.text(shopDetails.shopName, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
          detailY += lineHeight;
        }
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        if (shopDetails.address) {
          const addressLines = doc.splitTextToSize(shopDetails.address, detailsMaxWidth);
          doc.text(addressLines, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
          detailY += (addressLines.length * lineHeight);
        }
        if (shopDetails.emailId) {
          doc.text(`Email: ${shopDetails.emailId}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
          detailY += lineHeight;
        }
        if (shopDetails.mobileNumber) {
          doc.text(`Mobile: ${shopDetails.mobileNumber}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
          detailY += lineHeight;
        }
        if (shopDetails.gstNumber) {
          doc.text(`GST: ${shopDetails.gstNumber}`, detailsX, detailY, { maxWidth: detailsMaxWidth, align: "right" });
          detailY += lineHeight;
        }
        
        // Update header height based on actual content
        const newHeaderHeight = Math.max(logoSize, detailY - headerY) + 10;
        let newStartY = newHeaderHeight + 20;
        
        // Draw a line below header - double lines if customised rates are used
        doc.setLineWidth(1);
        doc.setDrawColor(0, 0, 0);
        if (isCustomisedRates) {
          // Draw double lines for customised rates
          doc.line(margin, newStartY - 10, pageWidth - margin, newStartY - 10);
          doc.line(margin, newStartY - 8, pageWidth - margin, newStartY - 8);
          newStartY += 10;
        } else {
          // Single line for standard rates
          doc.line(margin, newStartY - 10, pageWidth - margin, newStartY - 10);
          newStartY += 10;
        }
        
        // Add today's date below header line
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const dateX = pageWidth - margin;
        doc.text(`Date: ${dateStr}`, dateX, newStartY, { align: "right" });
        newStartY += lineHeight + 5;
        
        // Add heading: Quotation (curtains) - centered
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text("Quotation (curtains)", pageWidth / 2, newStartY, { align: "center" });
        newStartY += lineHeight + 10;
        
        // Add customer details in one line: Customer Name | Address | WhatsApp Number
        if (quotation.customerName || quotation.address || quotation.whatsappNumber) {
          doc.setFontSize(11);
          doc.setFont(undefined, "normal");
          
          let customerLine = "";
          if (quotation.customerName) {
            customerLine += quotation.customerName;
          }
          if (quotation.address) {
            if (customerLine) customerLine += " | ";
            customerLine += quotation.address;
          }
          if (quotation.whatsappNumber) {
            if (customerLine) customerLine += " | ";
            customerLine += quotation.whatsappNumber;
          }
          
          if (customerLine) {
            // Split text if too long to fit on one line
            const maxWidth = pageWidth - 2 * margin;
            const textWidth = doc.getTextWidth(customerLine);
            if (textWidth > maxWidth) {
              // Split into multiple lines if needed
              const lines = doc.splitTextToSize(customerLine, maxWidth);
              doc.text(lines, margin, newStartY);
              newStartY += (lines.length * lineHeight);
            } else {
              doc.text(customerLine, margin, newStartY);
              newStartY += lineHeight;
            }
          }
          
          newStartY += 10; // Add spacing before products
        }
        
        return newStartY;
      }
      return 50;
    }

    // Process each place group
    for (const place of sortedPlaces) {
      const placeProducts = groupedByPlace[place];
      let placeSubtotal = 0;
      
      // Check if we need a new page before place header
      if (startY > pageHeight - 200) {
        doc.addPage();
        startY = addHeader();
      }

      // Place Header with count
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text(`${placeIndex}. ${place} (${placeProducts.length})`, margin, startY);
      startY += lineHeight + 5;

      // Define item positions for line items (used for both products and subtotals)
      const itemStartX = margin;
      const itemNameX = margin + 80;
      const unitPriceX = margin + 200;
      const totalX = pageWidth - margin - 100;

      // Process each product in this place
      let productIndex = 1;
      for (const product of placeProducts) {
        // Check if we need a new page
        if (startY > pageHeight - 200) {
          doc.addPage();
          startY = addHeader();
        }

        // Get dimensions
        const height = parseFloat(product.height) || 0;
        const width = parseFloat(product.width) || 0;
        
        // Calculate required quantities based on curtain type
        let clothRequired = parseFloat(product.clothRequired) || 0;
        let astarRequired = parseFloat(product.astarRequired) || 0;
        let track = parseFloat(product.track) || 0;
        let platesRequired = 0;
        let stitchingArea = 0;
        
        if (product.curtainType === "AP") {
          // For AP type, calculate if not in product
          if (clothRequired === 0 && height > 0 && width > 0) {
            platesRequired = Math.ceil(width / 21);
            clothRequired = Math.ceil(((height + 12) / 36) * platesRequired);
            astarRequired = clothRequired;
            track = Math.ceil(width / 12);
          } else {
            platesRequired = parseFloat(product.platesRequired) || 0;
            if (astarRequired === 0) astarRequired = clothRequired;
            if (track === 0 && width > 0) track = Math.ceil(width / 12);
          }
        } else if (product.curtainType === "Roman") {
          // For Roman type, calculate if not in product
          if (clothRequired === 0 && height > 0 && width > 0) {
            const panna = 48;
            const clothMultiplier = Math.round(width / (panna - 4));
            clothRequired = Math.ceil(((height + 15) / 36) * clothMultiplier);
            astarRequired = clothRequired; // Astar required = cloth required for Roman
            track = 0; // Track is not used for Roman curtains
            stitchingArea = Math.ceil((width * height) / 144);
          } else {
            stitchingArea = parseFloat(product.stitchingArea) || 0;
            if (astarRequired === 0) astarRequired = clothRequired; // Ensure astar = cloth for Roman
            track = 0; // Track is not used for Roman curtains
          }
        } else if (product.curtainType === "Blinds") {
          // For Blinds type, calculate sq.ft = (height × width) / 144, rounded to nearest integer
          if (height > 0 && width > 0) {
            stitchingArea = Math.round((width * height) / 144);
          } else {
            stitchingArea = parseFloat(product.stitchingArea) || 0;
          }
        }
        
        // Get cloth rate for display
        const clothRatePerMeter = getCatalogPrice(product.catalogId);
        
        // Always recalculate charges using the rates provided (could be standard or customised rates)
        // This ensures that customised rates are properly applied
        let clothCharges = 0;
        let astarCharges = 0;
        let stitchingCharges = 0;
        let trackCharges = 0;
        let blindsCharges = 0; // For Blinds type
        
        // Calculate charges based on curtain type
        if (product.curtainType === "Blinds") {
          // Map blind type to rate field name
          const blindTypeToRateField = {
            "Customised": "customisedBlindRate",
            "Fabric Blind": "fabricBlindRate",
            "Eco-Blackout": "ecoBlackoutBlindRate",
            "Vertical": "verticalBlindRate",
            "Zebra": "zebraBlindRate"
          };
          
          // For Blinds: sq.ft × selected blind type rate
          if (stitchingArea > 0 && product.blindType) {
            const rateFieldName = blindTypeToRateField[product.blindType];
            if (rateFieldName && rates[rateFieldName] > 0) {
              blindsCharges = Math.round(stitchingArea * rates[rateFieldName]);
            }
          }
        } else {
          // For AP and Roman types
          // Calculate cloth charges
          if (clothRequired > 0 && clothRatePerMeter > 0) {
            clothCharges = Math.round(clothRequired * clothRatePerMeter);
          }
          
          // Calculate astar charges
          if (astarRequired > 0 && rates.astarStitchingRate > 0) {
            astarCharges = Math.round(astarRequired * rates.astarStitchingRate);
          }
          
          // Stitching charges calculation differs for AP and Roman
          if (product.curtainType === "AP" && platesRequired > 0 && rates.perPlateStitchingRate > 0) {
            stitchingCharges = Math.round(platesRequired * rates.perPlateStitchingRate);
          } else if (product.curtainType === "Roman" && stitchingArea > 0 && rates.perSqFtStitchingRate > 0) {
            stitchingCharges = Math.round(stitchingArea * rates.perSqFtStitchingRate);
          }
          
          // Calculate track charges - only for AP type, not for Roman
          if (product.curtainType === "AP" && track > 0 && rates.trackRatePerRunningFeet > 0) {
            trackCharges = Math.round(track * rates.trackRatePerRunningFeet);
          }
        }
        
        const productTotal = product.curtainType === "Blinds" 
          ? blindsCharges 
          : product.curtainType === "Roman"
          ? clothCharges + astarCharges + stitchingCharges // No track charges for Roman
          : clothCharges + astarCharges + stitchingCharges + trackCharges;
        grandTotal += productTotal;
        placeSubtotal += productTotal;

        // Product Header - only serial number
        doc.setFontSize(12);
        doc.setFont(undefined, "semibold");
        doc.text(`${productIndex}.`, margin, startY);
        startY += lineHeight;

        // Dimensions
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        const dimensions = [];
        if (product.height) dimensions.push(product.height);
        if (product.width) dimensions.push(product.width);
        if (dimensions.length > 0) {
          doc.text(`Dimensions: ${dimensions.join(" x ")}`, margin, startY);
          startY += lineHeight;
        }

        // Type
        doc.text(`Type: ${product.curtainType || "N/A"}`, margin, startY);
        startY += lineHeight;

        // Catalog No. - Don't show for Blinds type
        if (product.curtainType !== "Blinds") {
          let catalogNumber = product.catalog;
          if (!catalogNumber && product.catalogId && catalogList) {
            const catalog = catalogList.find(c => c._id === product.catalogId);
            if (catalog && catalog.number) {
              catalogNumber = catalog.number;
            }
          }
          if (catalogNumber) {
            doc.text(`Catalog No.: ${catalogNumber}`, margin, startY);
            startY += lineHeight;
          }
        }

        // Dashed line
        startY += 5;
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        const dashLength = 5;
        const gapLength = 3;
        let xPos = margin;
        while (xPos < pageWidth - margin) {
          doc.line(xPos, startY, xPos + dashLength, startY);
          xPos += dashLength + gapLength;
        }
        startY += 10;

        // Line items - formatted to match the image
        doc.setFontSize(11);
        
        // For Blinds type, show curtain cost
        if (product.curtainType === "Blinds") {
          // Map blind type to rate field name
          const blindTypeToRateField = {
            "Customised": "customisedBlindRate",
            "Fabric Blind": "fabricBlindRate",
            "Eco-Blackout": "ecoBlackoutBlindRate",
            "Vertical": "verticalBlindRate",
            "Zebra": "zebraBlindRate"
          };
          
          const rateFieldName = product.blindType ? blindTypeToRateField[product.blindType] : null;
          const blindsRate = rateFieldName ? rates[rateFieldName] : 0;
          
          if (stitchingArea > 0 && blindsRate > 0 && blindsCharges > 0) {
            doc.text(`${stitchingArea} sq.ft`, itemStartX, startY);
            doc.text("curtain cost", itemNameX, startY);
            const blindsRateDisplay = Math.round(blindsRate);
            doc.text(`Rs. ${blindsRateDisplay}/- per sq.ft`, unitPriceX, startY);
            doc.text(`Rs. ${blindsCharges}/-`, totalX, startY, { align: "right" });
            startY += lineHeight;
          }
        } else {
          // Cloth
          if (clothRequired > 0 && clothRatePerMeter > 0) {
            doc.text(`${clothRequired} meter`, itemStartX, startY);
            doc.text("Cloth", itemNameX, startY);
            // Ensure rate is displayed as integer
            const clothRateDisplay = Math.round(clothRatePerMeter);
            doc.text(`Rs. ${clothRateDisplay} per meter`, unitPriceX, startY);
            doc.text(`Rs. ${clothCharges}/-`, totalX, startY, { align: "right" });
            startY += lineHeight;
          }
        }

        // Astar - show for both AP and Roman if astarRequired > 0
        if (astarRequired > 0 && rates.astarStitchingRate > 0 && astarCharges > 0) {
          doc.text(`${astarRequired} meter`, itemStartX, startY);
          doc.text("Astar", itemNameX, startY);
          // Round rate to 2 decimal places for display
          const astarRateDisplay = Math.round(rates.astarStitchingRate * 100) / 100;
          doc.text(`Rs. ${astarRateDisplay}/- per meter`, unitPriceX, startY);
          doc.text(`Rs. ${astarCharges}/-`, totalX, startY, { align: "right" });
          startY += lineHeight;
        }

        // Stitching - different for AP and Roman
        if (product.curtainType === "AP" && platesRequired > 0 && rates.perPlateStitchingRate > 0) {
          doc.text(`${platesRequired} plates`, itemStartX, startY);
          doc.text("stitching", itemNameX, startY);
          // Round rate to 2 decimal places for display
          const stitchingRateDisplay = Math.round(rates.perPlateStitchingRate * 100) / 100;
          doc.text(`Rs. ${stitchingRateDisplay}/- per plate`, unitPriceX, startY);
          doc.text(`Rs. ${stitchingCharges}/-`, totalX, startY, { align: "right" });
          startY += lineHeight;
        } else if (product.curtainType === "Roman" && stitchingArea > 0 && rates.perSqFtStitchingRate > 0) {
          doc.text(`${stitchingArea} sq.ft`, itemStartX, startY);
          doc.text("stitching", itemNameX, startY);
          // Round rate to 2 decimal places for display
          const stitchingRateDisplay = Math.round(rates.perSqFtStitchingRate * 100) / 100;
          doc.text(`Rs. ${stitchingRateDisplay}/- per sq.ft`, unitPriceX, startY);
          doc.text(`Rs. ${stitchingCharges}/-`, totalX, startY, { align: "right" });
          startY += lineHeight;
        }

        // Track - show only for AP type, not for Roman
        if (product.curtainType === "AP" && track > 0 && rates.trackRatePerRunningFeet > 0 && trackCharges > 0) {
          doc.text(`${track} feet`, itemStartX, startY);
          doc.text("track", itemNameX, startY);
          // Round rate to 2 decimal places for display to avoid floating-point precision issues
          const trackRateDisplay = Math.round(rates.trackRatePerRunningFeet * 100) / 100;
          doc.text(`Rs. ${trackRateDisplay}/- running feet`, unitPriceX, startY);
          doc.text(`Rs. ${trackCharges}/-`, totalX, startY, { align: "right" });
          startY += lineHeight;
        }

        // Product Total
        startY += 5;
        doc.setFont(undefined, "bold");
        doc.setFontSize(12);
        doc.text(`Total`, itemStartX, startY);
        doc.text(`Rs. ${productTotal}/-`, totalX, startY, { align: "right" });
        startY += lineHeight + 10;
        
        productIndex++;
      }
      
      // Place Subtotal (if more than 1 product)
      if (placeProducts.length > 1) {
        startY += 5;
        doc.setFont(undefined, "semibold");
        doc.setFontSize(12);
        doc.text(`Subtotal for ${place}`, itemStartX, startY);
        doc.text(`Rs. ${placeSubtotal}/-`, totalX, startY, { align: "right" });
        startY += lineHeight + sectionSpacing;
      } else {
        startY += sectionSpacing;
      }
      
      placeIndex++;
    }

    // Grand Total
    if (startY > pageHeight - 100) {
      doc.addPage();
      startY = 50;
    }
    
    startY += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Grand Total", margin, startY);
    doc.text(`Rs. ${grandTotal}/-`, pageWidth - margin - 100, startY, { align: "right" });

    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      const footerText = "This software is developed by RightShift InfoTech, Pune (M: 8975425083)";
      const footerY = pageHeight - 15;
      doc.text(footerText, pageWidth / 2, footerY, { align: "center" });
    }

    // Save PDF
    const fileName = `Quotation_${quotation.customerName || 'Customer'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error("Error generating quotation PDF:", error);
    alert("Error generating PDF: " + error.message);
  }
}

