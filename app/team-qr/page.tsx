"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Image as ImageIcon, Palette } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { API_BASE_URL } from "@/lib/api";
import QRCodeLib from "qrcode";

const LOGO_OPTIONS = [
  {
    id: "talaash",
    name: "Talaash Logo",
    url: "https://www.thejaayveeworld.com/static/logos/talaash/talaash_logo.png",
  },
  {
    id: "jaayvee",
    name: "Jaayvee World Icon",
    url: "https://www.thejaayveeworld.com/static/logo%28icon%29%20white/jaayvee%20world%20icon-03.png",
  },
];

export default function TeamQRPage() {
  const [data, setData] = useState("");
  const [selectedLogo, setSelectedLogo] = useState<string>(LOGO_OPTIONS[0].id);
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate QR preview whenever data, colors, or logo change
  useEffect(() => {
    if (data.trim()) {
      const generatePreviewWithLogo = async () => {
        try {
          const selectedLogoOption = LOGO_OPTIONS.find((logo) => logo.id === selectedLogo);
          if (!selectedLogoOption) {
            setQrPreview(null);
            return;
          }

          // Generate QR code with high error correction for logo overlay in center
          const qrDataUrl = await new Promise<string>((resolve, reject) => {
            QRCodeLib.toDataURL(
              data.trim(),
              {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H', // High error correction allows logo in center
                color: {
                  dark: foregroundColor,
                  light: backgroundColor,
                },
              },
              (error, url) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(url);
                }
              }
            );
          });

          // Create canvas to overlay logo in center of QR code
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setQrPreview(qrDataUrl); // Fallback to QR without logo
            return;
          }

          // Load QR code image
          const qrImage = new Image();
          qrImage.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            qrImage.onload = () => {
              canvas.width = qrImage.width;
              canvas.height = qrImage.height;
              
              // Draw QR code first
              ctx.drawImage(qrImage, 0, 0);
              
              // Load and overlay logo in center
              const logoImage = new Image();
              logoImage.crossOrigin = "anonymous";
              logoImage.onload = () => {
                // Logo size: 18% of QR code size (safe for H error correction, similar to reference)
                const logoSize = Math.min(canvas.width, canvas.height) * 0.18;
                const logoX = (canvas.width - logoSize) / 2;
                const logoY = (canvas.height - logoSize) / 2;

                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const gapSize = 6; // 6px gap between QR data and logo
                const circleRadius = (logoSize / 2) + gapSize; // Logo radius + gap
                
                // Clear QR code data in the center area (create gap)
                // Use destination-out to erase, then fill with background color
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Reset composite operation and draw circular background for logo
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = backgroundColor;
                ctx.beginPath();
                ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Draw logo in center
                ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
                
                // Convert canvas to data URL for preview
                const previewUrl = canvas.toDataURL("image/png");
                setQrPreview(previewUrl);
                resolve();
              };
              logoImage.onerror = () => {
                // If logo fails to load, just use QR without logo
                console.warn("Logo failed to load for preview");
                const previewUrl = canvas.toDataURL("image/png");
                setQrPreview(previewUrl);
                resolve();
              };
              logoImage.src = selectedLogoOption.url;
            };
            qrImage.onerror = reject;
            qrImage.src = qrDataUrl;
          });
        } catch (error) {
          console.error("QR preview generation error:", error);
          // Fallback: generate QR without logo
          QRCodeLib.toDataURL(
            data.trim(),
            {
              width: 300,
              margin: 2,
              errorCorrectionLevel: 'H',
              color: {
                dark: foregroundColor,
                light: backgroundColor,
              },
            },
            (error, url) => {
              if (error) {
                setQrPreview(null);
              } else {
                setQrPreview(url);
              }
            }
          );
        }
      };

      generatePreviewWithLogo();
    } else {
      setQrPreview(null);
    }
  }, [data, foregroundColor, backgroundColor, selectedLogo]);

  const handleGenerate = async () => {
    if (!data.trim()) {
      setError("Please enter data for the QR code");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedLogoOption = LOGO_OPTIONS.find((logo) => logo.id === selectedLogo);
      if (!selectedLogoOption) {
        throw new Error("Invalid logo selection");
      }

      // Generate QR code client-side with high error correction for logo overlay in center
      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        QRCodeLib.toDataURL(
          data.trim(),
          {
            width: 512,
            margin: 2,
            errorCorrectionLevel: 'H', // High error correction allows logo in center
            color: {
              dark: foregroundColor,
              light: backgroundColor,
            },
          },
          (error, url) => {
            if (error) {
              reject(error);
            } else {
              resolve(url);
            }
          }
        );
      });

      // Create canvas to overlay logo in center of QR code
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Load QR code image
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;
          
          // Draw QR code first
          ctx.drawImage(qrImage, 0, 0);
          
          // Load and overlay logo in center
          const logoImage = new Image();
          logoImage.crossOrigin = "anonymous";
          logoImage.onload = () => {
            // Logo size: 18% of QR code size (safe for H error correction, similar to reference)
            const logoSize = Math.min(canvas.width, canvas.height) * 0.18;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const gapSize = 6; // 6px gap between QR data and logo
            const circleRadius = (logoSize / 2) + gapSize; // Logo radius + gap
            
            // Clear QR code data in the center area (create gap)
            // Use destination-out to erase, then fill with background color
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Reset composite operation and draw circular background for logo
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = backgroundColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Draw logo in center
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
            resolve();
          };
          logoImage.onerror = () => {
            // If logo fails to load, just use QR without logo
            console.warn("Logo failed to load, generating QR without logo");
            resolve();
          };
          logoImage.src = selectedLogoOption.url;
        };
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });

      // Download the QR code image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qr_code_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          throw new Error("Failed to generate QR code blob");
        }
      }, "image/png");
    } catch (err: any) {
      console.error("QR generation error:", err);
      setError(err.message || "Failed to generate QR code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2 flex items-center gap-2">
          <QrCode className="text-primary-accent" size={32} />
          Team QR Code Generator
        </h1>
        <p className="text-primary-muted">Create custom QR codes with company logos</p>
      </div>

      {/* Main Card */}
      <div className="card space-y-6">
        {/* Logo Selection */}
        <div>
          <label className="block text-sm font-medium text-primary-fg mb-3">
            Select Logo
          </label>
          <div className="grid grid-cols-2 gap-4">
            {LOGO_OPTIONS.map((logo) => (
              <button
                key={logo.id}
                onClick={() => setSelectedLogo(logo.id)}
                className={`relative p-4 border-2 rounded-xl transition-all ${
                  selectedLogo === logo.id
                    ? "border-primary-accent bg-primary-accent-light"
                    : "border-primary-border hover:border-primary-accent/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-primary-border">
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error(`Failed to load logo: ${logo.url}`);
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23ddd' width='48' height='48'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3ELogo%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-primary-fg">{logo.name}</p>
                    <p className="text-xs text-primary-muted truncate max-w-[200px]">
                      {logo.url}
                    </p>
                  </div>
                </div>
                {selectedLogo === logo.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary-accent rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Data Input */}
        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">
            QR Code Data
          </label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter URL, text, or any data for the QR code..."
            className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent resize-none"
            rows={4}
          />
          <p className="text-xs text-primary-muted mt-2">
            Enter the content you want to encode in the QR code (URL, text, etc.)
          </p>
        </div>

        {/* Color Customization */}
        <div>
          <label className="text-sm font-medium text-primary-fg mb-3 flex items-center gap-2">
            <Palette size={16} />
            Color Customization
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-primary-muted mb-2">
                Foreground Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-16 h-10 border border-primary-border rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent text-sm font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-primary-muted mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 border border-primary-border rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent text-sm font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500 rounded-xl text-green-500">
            QR code generated and downloaded successfully!
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !data.trim()}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating QR Code...
            </>
          ) : (
            <>
              <Download size={20} />
              Generate & Download QR Code
            </>
          )}
        </button>

        {/* Preview Section */}
        {data.trim() && (
          <div className="border-t border-primary-border pt-6">
            <h3 className="text-sm font-medium text-primary-fg mb-3">Preview</h3>
            <div className="bg-primary-accent-light p-6 rounded-xl">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* QR Code Preview */}
                <div className="flex-shrink-0">
                  <div className="bg-white p-4 rounded-lg border border-primary-border inline-block">
                    {qrPreview ? (
                      <img
                        src={qrPreview}
                        alt="QR Code Preview"
                        className="w-64 h-64 object-contain block"
                        style={{ minWidth: '256px', minHeight: '256px' }}
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center text-primary-muted" style={{ minWidth: '256px', minHeight: '256px' }}>
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary-muted border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs">Generating preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Preview Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-primary-muted">
                    <ImageIcon size={16} />
                    <span><strong>Logo:</strong> {LOGO_OPTIONS.find((l) => l.id === selectedLogo)?.name}</span>
                  </div>
                  <div className="text-sm text-primary-fg">
                    <strong>Data:</strong> {data.substring(0, 100)}
                    {data.length > 100 && "..."}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-primary-muted">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-primary-border" 
                        style={{ backgroundColor: foregroundColor }}
                      />
                      <span>Foreground: {foregroundColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-primary-border" 
                        style={{ backgroundColor: backgroundColor }}
                      />
                      <span>Background: {backgroundColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

