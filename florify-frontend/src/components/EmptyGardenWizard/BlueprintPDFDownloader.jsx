import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BlueprintPDFDownloader = ({ blueprintModel, gardenName }) => {
  const svgRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Get the SVG element
      const svgElement = svgRef.current;
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Convert SVG to canvas
      const canvas = await html2canvas(svgElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Calculate dimensions for A4 landscape
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const imgWidth = pdfWidth - 20; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(gardenName || 'Garden Blueprint', 10, 15);

      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 22);

      // Add the blueprint image
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, Math.min(imgHeight, pdfHeight - 40));

      // Add legend
      const legendY = Math.min(30 + imgHeight + 10, pdfHeight - 20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Legend:', 10, legendY);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Add legend items
      const legendItems = [
        { color: '#e74c3c', label: 'Buildings' },
        { color: '#7f8c8d', label: 'Pathways' },
        { color: '#8e44ad', label: 'Boundary Walls' }
      ];

      legendItems.forEach((item, index) => {
        const y = legendY + 8 + (index * 6);
        pdf.setFillColor(item.color);
        pdf.rect(10, y - 2, 3, 3, 'F');
        pdf.text(item.label, 16, y);
      });

      // Add scale information
      pdf.text('Scale: 1:100 (1mm = 1cm)', 10, legendY + 30);

      // Save the PDF
      pdf.save(`${gardenName || 'garden-blueprint'}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Convert SVG pixels to mm
  const pixelsToMm = (pixels) => pixels / 3.78;

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none'
    };

    switch (shape.type) {
      case 'polyline':
        return (
          <polyline
            {...commonProps}
            points={points}
          />
        );
      case 'polygon':
        return (
          <polygon
            {...commonProps}
            points={points}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="pdf-downloader">
      <div className="pdf-preview">
        <h3>Blueprint Preview</h3>
        <div className="preview-container">
          <svg
            ref={svgRef}
            viewBox={blueprintModel.getViewBox()}
            width="100%"
            height="400px"
            className="blueprint-svg-preview"
          >
            {/* Grid background */}
            <defs>
              <pattern id="pdf-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pdf-grid)" />
            
            {/* Render all shapes */}
            {blueprintModel.data.shapes.map(shape => (
              <g key={shape.id}>
                {renderShape(shape)}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="pdf-actions">
        <div className="pdf-info">
          <h4>Download Your Blueprint</h4>
          <p>Your garden blueprint is ready! Download it as a PDF to print or share.</p>
          
          <div className="blueprint-details">
            <div className="detail-item">
              <strong>Garden Name:</strong> {gardenName || 'Untitled Garden'}
            </div>
            <div className="detail-item">
              <strong>Elements:</strong> {blueprintModel.data.shapes.length} shapes drawn
            </div>
            <div className="detail-item">
              <strong>Scale:</strong> 1:100 (1mm = 1cm)
            </div>
            <div className="detail-item">
              <strong>Format:</strong> A4 Landscape
            </div>
          </div>
        </div>

        <button 
          className="download-btn"
          onClick={generatePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating PDF...
            </>
          ) : (
            <>
              📄 Download PDF
            </>
          )}
        </button>

        <div className="pdf-features">
          <h5>PDF Features:</h5>
          <ul>
            <li>✅ High-quality vector graphics</li>
            <li>✅ Print-ready A4 format</li>
            <li>✅ Color-coded legend</li>
            <li>✅ Scale information</li>
            <li>✅ Professional layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlueprintPDFDownloader;