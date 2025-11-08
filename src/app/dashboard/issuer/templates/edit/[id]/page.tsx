"use client";

import type React from "react";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Trash2, Save, Loader2, Bold, Italic } from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { GOOGLE_FONTS } from "@/lib/fonts";
import { LoadingScreen } from "@/components/loading-screen";
import { ColorPickerComponent } from "@/components/ui/color-picker";
import { generateDummyQRCodeBrowser } from "@/lib/qrcode/browser-generator";
import { IQRCodeStyling } from "@/models/Template";
import { GoogleFontsLoader } from "@/components/google-fonts-loader";

interface TemplateField {
  id: string;
  name: string;
  type: "text" | "email" | "number" | "date" | "id" | "qr";
  x?: number;
  y?: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  qrCodeStyling?: IQRCodeStyling; // QR code styling options (only for QR type fields)
}

export default function EditTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const badgeImageRef = useRef<HTMLImageElement | null>(null);
  const qrCodeImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("general");
  const [newCategory, setNewCategory] = useState("");
  const [templateType, setTemplateType] = useState<
    "certificate" | "badge" | "both"
  >("certificate");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [badgeImage, setBadgeImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFontFamily] = useState("Roboto");
  const [selectedFontSize] = useState(16);
  const [selectedFontColor] = useState("#000000");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [isMovingField, setIsMovingField] = useState(false);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [fieldDragOffset, setFieldDragOffset] = useState({ x: 0, y: 0 });

  // New field creation states
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "text" | "email" | "number" | "date" | "id" | "qr"
  >("text");
  const [pendingField, setPendingField] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Modal states for error and success messages
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login");
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role === "issuer" &&
      !session.user?.isVerified
    ) {
      router.push("/auth/issuer/login?pending=true");
    } else if (
      status === "authenticated" &&
      session?.user?.role === "issuer" &&
      session.user?.isVerified
    ) {
      loadTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/issuer/templates/${templateId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login");
          return;
        }
        setModalMessage("Failed to load template");
        setShowErrorModal(true);
        setTimeout(() => {
          setShowErrorModal(false);
          // Allow modal to close before navigation
          setTimeout(() => {
            router.push("/dashboard/issuer/templates");
          }, 100);
        }, 1500);
        return;
      }

      const data = await res.json();
      const template = data.template || data;

      // Populate form with existing data
      setTemplateName(template.name || "");
      setCategory(template.category || "general");
      setTemplateType(template.type || "certificate");

      // Load certificate image first if available
      if (template.certificateImageUrl || template.certificateImage) {
        const imageUrl =
          template.certificateImageUrl || template.certificateImage;
        setCertificateImage(imageUrl);

        // Load image and wait for it to complete
        const img = new Image();
        img.crossOrigin = "anonymous";

        const imageLoadPromise = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn("Image load timeout");
            resolve();
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeout);
            imageRef.current = img;
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timeout);
            console.error("Failed to load image");
            resolve();
          };
        });

        img.src = imageUrl;
        await imageLoadPromise;

        // Now convert placeholders to fields with coordinate conversion
        if (
          template.placeholders &&
          Array.isArray(template.placeholders) &&
          img.complete &&
          img.naturalWidth > 0
        ) {
          const actualImageWidth = img.naturalWidth;
          const actualImageHeight = img.naturalHeight;

          const loadedFields = template.placeholders.map(
            (
              p: {
                fieldName?: string;
                name?: string;
                type?: string;
                x?: number;
                y?: number;
                width?: number;
                height?: number;
                fontFamily?: string;
                fontSize?: number;
                color?: string;
                fontColor?: string;
                bold?: boolean;
                italic?: boolean;
                qrCodeStyling?: IQRCodeStyling;
              },
              index: number
            ) => {
              // Convert from image coordinates to canvas coordinates if coordinates exist
              if (p.x !== undefined && p.y !== undefined) {
                const { scaleX, scaleY } = calculateImageScale(
                  CANVAS_WIDTH,
                  CANVAS_HEIGHT,
                  actualImageWidth,
                  actualImageHeight
                );

                // QR codes are stored with top-left coordinates, not center coordinates
                const isQRCode = p.type === "qr";

                if (isQRCode) {
                  // QR codes: x and y are already top-left coordinates
                  const canvasX = p.x / scaleX;
                  const canvasY = p.y / scaleY;
                  const canvasWidth = p.width ? p.width / scaleX : 150;
                  const canvasHeight = p.height ? p.height / scaleY : 150;

                  return {
                    id: `field-${Date.now()}-${index}`,
                    name: p.fieldName || p.name || "QR Code",
                    type: p.type || "qr",
                    x: canvasX,
                    y: canvasY,
                    width: canvasWidth,
                    height: canvasHeight,
                    fontFamily: p.fontFamily || "Roboto",
                    fontSize: 16,
                    fontColor: p.fontColor || p.color || "#000000",
                    bold: false,
                    italic: false,
                    qrCodeStyling: p.qrCodeStyling || {
                      dotsType: "rounded",
                      dotsColor: "#f55971", // Primary color
                      dotsColorType: "single",
                      backgroundOptions: {
                        color: "#FFFFFF", // White background by default
                        colorType: "single",
                      },
                      cornersSquareOptions: {
                        type: "extra-rounded",
                        color: "#f55971", // Primary color
                      },
                      cornersDotOptions: {
                        type: "dot",
                        color: "#f55971", // Primary color
                      },
                      qrOptions: {
                        errorCorrectionLevel: "H",
                      },
                    },
                  };
                } else {
                  // Other fields: x and y are center coordinates (for text fields)
                  const canvasX = p.x / scaleX;
                  const canvasY = p.y / scaleY;

                  // Convert width/height if provided
                  const canvasWidth = p.width ? p.width / scaleX : 200;
                  const canvasHeight = p.height ? p.height / scaleY : 40;

                  // Calculate top-left corner from center
                  const topLeftX = canvasX - canvasWidth / 2;
                  const topLeftY = canvasY - canvasHeight / 2;

                  // Convert font size back to canvas scale
                  const canvasFontSize = p.fontSize
                    ? Math.round(p.fontSize / ((scaleX + scaleY) / 2))
                    : 16;

                  return {
                    id: `field-${Date.now()}-${index}`,
                    name: p.fieldName || p.name || `Field ${index + 1}`,
                    type: p.type || "text",
                    x: topLeftX,
                    y: topLeftY,
                    width: canvasWidth,
                    height: canvasHeight,
                    fontFamily: p.fontFamily || "Roboto",
                    fontSize: canvasFontSize,
                    fontColor: p.fontColor || p.color || "#000000",
                    bold: p.bold || false,
                    italic: p.italic || false,
                  };
                }
              } else {
                // Email field without coordinates
                return {
                  id: `field-${Date.now()}-${index}`,
                  name: p.fieldName || p.name || `Field ${index + 1}`,
                  type: p.type || "text",
                  x: undefined,
                  y: undefined,
                  width: 200,
                  height: 40,
                  fontFamily: p.fontFamily || "Roboto",
                  fontSize: p.fontSize || 16,
                  fontColor: p.fontColor || p.color || "#000000",
                  bold: p.bold || false,
                  italic: p.italic || false,
                };
              }
            }
          );
          setFields(loadedFields);
        } else if (
          template.placeholders &&
          Array.isArray(template.placeholders)
        ) {
          // Fallback: Load placeholders without coordinate conversion
          const loadedFields = template.placeholders.map(
            (
              p: {
                fieldName?: string;
                name?: string;
                type?: string;
                x?: number;
                y?: number;
                width?: number;
                height?: number;
                fontFamily?: string;
                fontSize?: number;
                color?: string;
                fontColor?: string;
                bold?: boolean;
                italic?: boolean;
                qrCodeStyling?: IQRCodeStyling;
              },
              index: number
            ) => {
              const isQRCode = p.type === "qr";
              // QR codes are stored with top-left coordinates
              if (isQRCode && p.x !== undefined && p.y !== undefined) {
                return {
                  id: `field-${Date.now()}-${index}`,
                  name: p.fieldName || p.name || "QR Code",
                  type: p.type || "qr",
                  x: p.x,
                  y: p.y,
                  width: p.width || 150,
                  height: p.height || 150,
                  fontFamily: p.fontFamily || "Roboto",
                  fontSize: 16,
                  fontColor: p.fontColor || p.color || "#000000",
                  bold: false,
                  italic: false,
                };
              }
              // Other fields - handle as center coordinates
              if (p.x !== undefined && p.y !== undefined) {
                const canvasWidth = p.width || 200;
                const canvasHeight = p.height || 40;
                const topLeftX = p.x - canvasWidth / 2;
                const topLeftY = p.y - canvasHeight / 2;
                return {
                  id: `field-${Date.now()}-${index}`,
                  name: p.fieldName || p.name || `Field ${index + 1}`,
                  type: p.type || "text",
                  x: topLeftX,
                  y: topLeftY,
                  width: canvasWidth,
                  height: canvasHeight,
                  fontFamily: p.fontFamily || "Roboto",
                  fontSize: p.fontSize || 16,
                  fontColor: p.fontColor || p.color || "#000000",
                  bold: p.bold || false,
                  italic: p.italic || false,
                };
              }
              // Field without coordinates
              return {
                id: `field-${Date.now()}-${index}`,
                name: p.fieldName || p.name || `Field ${index + 1}`,
                type: p.type || "text",
                x: undefined,
                y: undefined,
                width: 200,
                height: 40,
                fontFamily: p.fontFamily || "Roboto",
                fontSize: p.fontSize || 16,
                fontColor: p.fontColor || p.color || "#000000",
                bold: p.bold || false,
                italic: p.italic || false,
              };
            }
          );
          setFields(loadedFields);
        }
      } else if (
        template.placeholders &&
        Array.isArray(template.placeholders)
      ) {
        // No image, just load placeholders as-is
        const loadedFields = template.placeholders.map(
          (
            p: {
              fieldName?: string;
              name?: string;
              type?: string;
              x?: number;
              y?: number;
              width?: number;
              height?: number;
              fontFamily?: string;
              fontSize?: number;
              color?: string;
              fontColor?: string;
              bold?: boolean;
              italic?: boolean;
            },
            index: number
          ) => {
            const isQRCode = p.type === "qr";
            // QR codes are stored with top-left coordinates
            if (isQRCode && p.x !== undefined && p.y !== undefined) {
              return {
                id: `field-${Date.now()}-${index}`,
                name: p.fieldName || p.name || "QR Code",
                type: p.type || "qr",
                x: p.x,
                y: p.y,
                width: p.width || 150,
                height: p.height || 150,
                fontFamily: p.fontFamily || "Roboto",
                fontSize: 16,
                fontColor: p.fontColor || p.color || "#000000",
                bold: false,
                italic: false,
              };
            }
            // Other fields - handle as center coordinates
            if (p.x !== undefined && p.y !== undefined) {
              const canvasWidth = p.width || 200;
              const canvasHeight = p.height || 40;
              const topLeftX = p.x - canvasWidth / 2;
              const topLeftY = p.y - canvasHeight / 2;
              return {
                id: `field-${Date.now()}-${index}`,
                name: p.fieldName || p.name || `Field ${index + 1}`,
                type: p.type || "text",
                x: topLeftX,
                y: topLeftY,
                width: canvasWidth,
                height: canvasHeight,
                fontFamily: p.fontFamily || "Roboto",
                fontSize: p.fontSize || 16,
                fontColor: p.fontColor || p.color || "#000000",
                bold: p.bold || false,
                italic: p.italic || false,
              };
            }
            // Field without coordinates
            return {
              id: `field-${Date.now()}-${index}`,
              name: p.fieldName || p.name || `Field ${index + 1}`,
              type: p.type || "text",
              x: undefined,
              y: undefined,
              width: 200,
              height: 40,
              fontFamily: p.fontFamily || "Roboto",
              fontSize: p.fontSize || 16,
              fontColor: p.fontColor || p.color || "#000000",
              bold: p.bold || false,
              italic: p.italic || false,
            };
          }
        );
        setFields(loadedFields);
      }

      if (template.badgeImageUrl || template.badgeImage) {
        const badgeUrl = template.badgeImageUrl || template.badgeImage;
        setBadgeImage(badgeUrl);
        const badgeImg = new Image();
        badgeImg.crossOrigin = "anonymous";
        badgeImg.onload = () => {
          badgeImageRef.current = badgeImg;
        };
        badgeImg.src = badgeUrl;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading template:", error);
      setModalMessage("Failed to load template");
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
        // Allow modal to close before navigation
        setTimeout(() => {
          router.push("/dashboard/issuer/templates");
        }, 100);
      }, 1500);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with dark background (matching create template)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw certificate image if available
    if (imageRef.current) {
      const img = imageRef.current;
      // Display image at full scale without compressing
      const maxWidth = canvas.width;
      const maxHeight = canvas.height;
      let displayWidth = img.width;
      let displayHeight = img.height;

      // Only scale down if image is larger than canvas
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const scale = Math.min(
          maxWidth / displayWidth,
          maxHeight / displayHeight
        );
        displayWidth *= scale;
        displayHeight *= scale;
      }

      const x = (canvas.width - displayWidth) / 2;
      const y = (canvas.height - displayHeight) / 2;

      ctx.drawImage(img, x, y, displayWidth, displayHeight);
    } else {
      // Draw placeholder
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.fillStyle = "#666";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Certificate Preview",
        canvas.width / 2,
        canvas.height / 2 - 20
      );
      ctx.fillText(
        "Upload image above to see preview",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }

    // Draw fields (matching create template styling)
    fields.forEach((field) => {
      if (field.x === undefined || field.y === undefined) return;

      const isSelected = field.id === selectedField;
      const borderColor = isSelected ? "#DB2777" : "#666";
      const fillColor = isSelected
        ? "rgba(219, 39, 119, 0.1)"
        : "rgba(100, 100, 100, 0.1)";

      // Handle QR code fields differently
      if (field.type === "qr") {
        // Draw QR code placeholder box
        ctx.fillStyle = fillColor;
        ctx.fillRect(field.x, field.y, field.width, field.height);

        // Draw border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(field.x, field.y, field.width, field.height);

        // Try to load and draw QR code image
        const qrImage = qrCodeImagesRef.current.get(field.id);
        if (qrImage) {
          ctx.drawImage(qrImage, field.x, field.y, field.width, field.height);
        } else {
          // Draw placeholder text while QR code loads
          ctx.fillStyle = "#666";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "QR Code",
            field.x + field.width / 2,
            field.y + field.height / 2
          );

          // Generate and load QR code asynchronously (browser-compatible) with styling
          generateDummyQRCodeBrowser(
            "https://credvault.app",
            Math.max(field.width, field.height),
            field.qrCodeStyling
          )
            .then((dataUrl: string) => {
              const img = new Image();
              img.onload = () => {
                qrCodeImagesRef.current.set(field.id, img);
                drawCanvas(); // Redraw to show QR code
              };
              img.src = dataUrl;
            })
            .catch((error: unknown) => {
              console.error("Error generating dummy QR code:", error);
            });
        }
        return;
      }

      // Draw field box
      ctx.fillStyle = fillColor;
      ctx.fillRect(field.x, field.y, field.width, field.height);

      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(field.x, field.y, field.width, field.height);

      // Draw field label centered with custom font
      const fontFamily = field.fontFamily || selectedFontFamily;
      const fontSize = field.fontSize || selectedFontSize;
      const fontColor = field.fontColor || selectedFontColor;
      const isBold = field.bold || false;
      const isItalic = field.italic || false;

      ctx.fillStyle = fontColor;
      // Build font string with bold and italic
      let fontStyle = "";
      if (isBold && isItalic) {
        fontStyle = "bold italic ";
      } else if (isBold) {
        fontStyle = "bold ";
      } else if (isItalic) {
        fontStyle = "italic ";
      }
      ctx.font = `${fontStyle}${fontSize}px "${fontFamily}", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calculate center position
      const centerX = field.x + field.width / 2;
      const centerY = field.y + field.height / 2;

      ctx.fillText(field.name, centerX, centerY);

      // Reset text alignment for other operations
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    });

    // Draw dragging rectangle if creating new field
    if (isDragging && dragStart.x && dragCurrent.x) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);

      ctx.strokeStyle = "#DB2777";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = "rgba(219, 39, 119, 0.1)";
      ctx.fillRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [
    fields,
    selectedField,
    selectedFontFamily,
    selectedFontSize,
    selectedFontColor,
    isDragging,
    dragStart,
    dragCurrent,
  ]);

  // Effect to redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "certificate" | "badge"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === "certificate") {
        setCertificateImage(dataUrl);
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          drawCanvas();
        };
        img.src = dataUrl;
      } else {
        setBadgeImage(dataUrl);
        const img = new Image();
        img.onload = () => {
          badgeImageRef.current = img;
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const addField = (type: TemplateField["type"]) => {
    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      name:
        type === "email"
          ? "Recipient Email"
          : `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      type,
      x: type === "email" ? undefined : 50,
      y: type === "email" ? undefined : 50,
      width: 200,
      height: 40,
      fontFamily: selectedFontFamily,
      fontSize: selectedFontSize,
      fontColor: selectedFontColor,
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
    }
  };

  // Helper function to propagate Name field styling to optional fields
  const propagateNameFieldStyling = (
    fields: TemplateField[],
    nameField: TemplateField | undefined
  ): TemplateField[] => {
    if (!nameField) return fields;

    return fields.map((f) => {
      const isEmailField = f.type === "email";
      const isIssueDateField =
        f.type === "date" && f.name.toLowerCase().trim() === "issue date";
      const isExpiryDateField =
        f.type === "date" && f.name.toLowerCase().trim() === "expiry date";

      // Update optional fields to match Name field styling
      if (isEmailField || isIssueDateField || isExpiryDateField) {
        return {
          ...f,
          fontFamily: nameField.fontFamily,
          fontSize: nameField.fontSize,
          fontColor: nameField.fontColor,
          bold: nameField.bold,
          italic: nameField.italic,
        };
      }
      return f;
    });
  };

  // Add new field from dialog
  const handleAddNewField = () => {
    // QR code fields don't require a name - auto-set to "QR Code"
    const isQRCodeField = newFieldType === "qr";

    if (!isQRCodeField && !newFieldName.trim()) {
      setModalMessage("Please enter a field name");
      setShowErrorModal(true);
      return;
    }

    // Check if QR code field already exists
    if (isQRCodeField) {
      const hasQRCodeField = fields.some((f) => f.type === "qr");
      if (hasQRCodeField) {
        setModalMessage(
          "QR Code field already exists. Only one QR Code field is allowed."
        );
        setShowErrorModal(true);
        return;
      }
      // QR codes must have coordinates (drawn on canvas)
      if (!pendingField) {
        setModalMessage("Please draw the QR code field on the canvas");
        setShowErrorModal(true);
        return;
      }
    }

    // For email fields, coordinates are always optional
    // For Issue Date and Expiry Date, coordinates are optional (can be displayed or not)
    const isEmailField = newFieldType === "email";
    const isExpiryDateField =
      newFieldType === "date" &&
      newFieldName.toLowerCase().trim() === "expiry date";
    const isIssueDateField =
      newFieldType === "date" &&
      newFieldName.toLowerCase().trim() === "issue date";

    // Find Name field to copy styling from (mandatory field)
    const nameField = fields.find(
      (f) => f.name.toLowerCase().trim() === "name"
    );

    // If user drew on canvas (pendingField exists), use coordinates (field will be displayed)
    // If no pendingField, coordinates are undefined (field won't be displayed)
    if (isEmailField || isExpiryDateField || isIssueDateField) {
      const newField: TemplateField = {
        id: `field-${Date.now()}`,
        name: newFieldName,
        type: newFieldType,
        // Use coordinates if user drew on canvas, otherwise undefined
        x: pendingField?.x,
        y: pendingField?.y,
        width: pendingField?.width || 0,
        height: pendingField?.height || 0,
        // Copy styling from Name field if it exists (for optional date fields), otherwise use selected styling
        fontFamily:
          (isIssueDateField || isExpiryDateField) && nameField?.fontFamily
            ? nameField.fontFamily
            : selectedFontFamily,
        fontSize:
          (isIssueDateField || isExpiryDateField) && nameField?.fontSize
            ? nameField.fontSize
            : selectedFontSize,
        fontColor:
          (isIssueDateField || isExpiryDateField) && nameField?.fontColor
            ? nameField.fontColor
            : selectedFontColor,
        bold:
          isIssueDateField || isExpiryDateField
            ? nameField?.bold ?? false
            : false,
        italic:
          isIssueDateField || isExpiryDateField
            ? nameField?.italic ?? false
            : false,
      };
      setFields([...fields, newField]);
      setSelectedField(newField.id);
    } else if (isQRCodeField && pendingField) {
      // QR code field - auto-set name to "QR Code" and require coordinates
      // Ensure square aspect ratio for QR codes
      const size = Math.max(pendingField.width, pendingField.height, 50); // Use larger dimension, minimum 50px
      // Center the QR code on the drawn area
      const centerX = pendingField.x + pendingField.width / 2;
      const centerY = pendingField.y + pendingField.height / 2;
      const qrX = centerX - size / 2;
      const qrY = centerY - size / 2;

      const qrCodeField: TemplateField = {
        id: `field-${Date.now()}`,
        name: "QR Code", // Auto-set name
        type: "qr",
        x: Math.max(
          0,
          Math.min(qrX, (canvasRef.current?.width || CANVAS_WIDTH) - size)
        ), // Ensure within canvas bounds
        y: Math.max(
          0,
          Math.min(qrY, (canvasRef.current?.height || CANVAS_HEIGHT) - size)
        ), // Ensure within canvas bounds
        width: size,
        height: size,
        // QR codes don't use font styling
        fontFamily: selectedFontFamily,
        fontSize: selectedFontSize,
        fontColor: selectedFontColor,
        bold: false,
        italic: false,
      };
      setFields([...fields, qrCodeField]);
      setSelectedField(qrCodeField.id);
    } else {
      // For other fields, require coordinates from pendingField
      if (!pendingField) {
        setModalMessage("Please draw a field on the canvas");
        setShowErrorModal(true);
        return;
      }
      const isNameField = newFieldName.toLowerCase().trim() === "name";
      const newField: TemplateField = {
        id: `field-${Date.now()}`,
        name: newFieldName,
        type: newFieldType,
        x: pendingField.x,
        y: pendingField.y,
        width: pendingField.width,
        height: pendingField.height,
        fontFamily: selectedFontFamily,
        fontSize: selectedFontSize,
        fontColor: selectedFontColor,
      };
      const updatedFields = [...fields, newField];
      // If Name field was added, propagate its styling to existing optional fields
      if (isNameField) {
        const propagatedFields = propagateNameFieldStyling(
          updatedFields,
          newField
        );
        setFields(propagatedFields);
      } else {
        setFields(updatedFields);
      }
      setSelectedField(newField.id);
    }

    setShowNewField(false);
    setPendingField(null);
    setNewFieldName("");
    setNewFieldType("text");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !certificateImage) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    // Check if clicking on existing field (only those with coordinates)
    const clickedField = fields.find(
      (f) =>
        f.x !== undefined &&
        f.y !== undefined &&
        x >= f.x &&
        x <= f.x + f.width &&
        y >= f.y &&
        y <= f.y + f.height
    );

    if (
      clickedField &&
      clickedField.x !== undefined &&
      clickedField.y !== undefined
    ) {
      setSelectedField(clickedField.id);
      // Start moving the field
      setIsMovingField(true);
      setMovingFieldId(clickedField.id);
      setFieldDragOffset({
        x: x - clickedField.x,
        y: y - clickedField.y,
      });
      setDragStart({ x, y });
      setDragCurrent({ x, y });
      return;
    }

    // Start dragging to create new field
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setSelectedField(null);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Disable interactions if no certificate image is uploaded
      if (!certificateImage) {
        canvas.style.cursor = "default";
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);

      if (isMovingField && movingFieldId) {
        // Update the field position in real-time (only for fields with coordinates)
        setFields((prevFields) => {
          const field = prevFields.find((f) => f.id === movingFieldId);
          if (field && field.x !== undefined && field.y !== undefined) {
            const newX = Math.max(
              0,
              Math.min(currentX - fieldDragOffset.x, canvas.width - field.width)
            );
            const newY = Math.max(
              0,
              Math.min(
                currentY - fieldDragOffset.y,
                canvas.height - field.height
              )
            );

            return prevFields.map((f) =>
              f.id === movingFieldId ? { ...f, x: newX, y: newY } : f
            );
          }
          return prevFields;
        });
        setDragCurrent({ x: currentX, y: currentY });
        canvas.style.cursor = "grabbing";
      } else if (isDragging) {
        setDragCurrent({ x: currentX, y: currentY });
        canvas.style.cursor = "crosshair";
      } else {
        // Check if hovering over a field (only those with coordinates)
        const hoveredField = fields.find(
          (f) =>
            f.x !== undefined &&
            f.y !== undefined &&
            currentX >= f.x &&
            currentX <= f.x + f.width &&
            currentY >= f.y &&
            currentY <= f.y + f.height
        );
        canvas.style.cursor = hoveredField ? "grab" : "crosshair";
      }
    },
    [
      certificateImage,
      isMovingField,
      movingFieldId,
      fieldDragOffset,
      isDragging,
      fields,
    ]
  );

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      setIsDragging(false);
      setIsMovingField(false);
      setMovingFieldId(null);
      return;
    }

    // Handle field movement
    if (isMovingField && movingFieldId) {
      setIsMovingField(false);
      setMovingFieldId(null);
      setFieldDragOffset({ x: 0, y: 0 });
      canvasRef.current.style.cursor = "grab";
      return;
    }

    // Handle new field creation
    if (isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endX =
        (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
      const endY =
        (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

      // Calculate width and height from drag
      const width = Math.max(Math.abs(endX - dragStart.x), 50);
      const height = Math.max(Math.abs(endY - dragStart.y), 20);
      const x = Math.min(dragStart.x, endX);
      const y = Math.min(dragStart.y, endY);

      // Store the pending field and open dialog to name it
      setPendingField({ x, y, width, height });
      setShowNewField(true);
      setNewFieldName("");
      setNewFieldType("text");

      setIsDragging(false);
      setDragCurrent({ x: 0, y: 0 });
      canvasRef.current.style.cursor = "crosshair";
    } else {
      setIsDragging(false);
      setIsMovingField(false);
    }
  };

  const calculateImageScale = (
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const scaleX = imageWidth / canvasWidth;
    const scaleY = imageHeight / canvasHeight;
    return { scaleX, scaleY };
  };

  const convertCanvasToImageCoords = (
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const { scaleX, scaleY } = calculateImageScale(
      canvasWidth,
      canvasHeight,
      imageWidth,
      imageHeight
    );
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY,
    };
  };

  const handleUpdateTemplate = async () => {
    if (!templateName.trim()) {
      setModalMessage("Please enter a template name");
      setShowErrorModal(true);
      return;
    }

    const hasEmailField = fields.some((f) => f.type === "email");
    if (!hasEmailField) {
      setModalMessage(
        "Please add at least one email field. Email is required for credential issuance."
      );
      setShowErrorModal(true);
      return;
    }

    // Check if Name field exists (case-insensitive) - Not required for badge templates
    const hasNameField = fields.some(
      (f) => f.name.toLowerCase().trim() === "name"
    );
    if (!hasNameField && templateType !== "badge") {
      setModalMessage(
        "Please add a 'Name' field. Name is required for credential issuance."
      );
      setShowErrorModal(true);
      return;
    }

    // Check if Issue Date field exists (case-insensitive, must be type "date")
    const hasIssueDateField = fields.some(
      (f) => f.name.toLowerCase().trim() === "issue date" && f.type === "date"
    );
    if (!hasIssueDateField) {
      setModalMessage(
        "Please add an 'Issue Date' field of type 'Date'. Issue Date is required for credential issuance."
      );
      setShowErrorModal(true);
      return;
    }

    // Validate images based on template type
    if (templateType === "certificate" || templateType === "both") {
      if (!certificateImage || !imageRef.current) {
        setModalMessage("Please upload a certificate image first");
        setShowErrorModal(true);
        return;
      }
    }
    if (templateType === "badge" || templateType === "both") {
      if (!badgeImage || !badgeImageRef.current) {
        setModalMessage("Please upload a badge image first");
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setModalMessage("Canvas not available");
        setShowErrorModal(true);
        setSaving(false);
        return;
      }

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      // Use appropriate image dimensions based on template type
      let actualImageWidth = 800;
      let actualImageHeight = 600;
      if (templateType === "certificate" || templateType === "both") {
        actualImageWidth = imageRef.current?.width || 800;
        actualImageHeight = imageRef.current?.height || 600;
      } else if (templateType === "badge") {
        actualImageWidth = badgeImageRef.current?.width || 800;
        actualImageHeight = badgeImageRef.current?.height || 600;
      }

      const templateData = {
        name: templateName.trim(),
        category: newCategory.trim() || category,
        type: templateType,
        fields: fields.map((f) => {
          // For email fields and expiry date fields, coordinates are optional (they may not be displayed)
          const isEmailField = f.type === "email";
          const isExpiryDateField =
            f.type === "date" && f.name.toLowerCase().trim() === "expiry date";
          if (
            (isEmailField || isExpiryDateField) &&
            f.x === undefined &&
            f.y === undefined
          ) {
            const fieldData = {
              name: f.name,
              type: f.type,
              coordinates: undefined,
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: f.fontSize || selectedFontSize,
              fontColor: f.fontColor || selectedFontColor,
              bold: f.bold === true, // Explicitly convert to boolean
              italic: f.italic === true, // Explicitly convert to boolean
            };
            console.log(
              `[Edit Template] ${
                isEmailField ? "Email" : "Expiry Date"
              } field "${f.name}": bold=${fieldData.bold}, italic=${
                fieldData.italic
              }`
            );
            return fieldData;
          }

          if (f.x !== undefined && f.y !== undefined) {
            // Handle QR code fields differently - store top-left corner and size
            if (f.type === "qr") {
              calculateImageScale(
                canvasWidth,
                canvasHeight,
                actualImageWidth,
                actualImageHeight
              );

              const topLeft = convertCanvasToImageCoords(
                f.x,
                f.y,
                canvasWidth,
                canvasHeight,
                actualImageWidth,
                actualImageHeight
              );
              const bottomRight = convertCanvasToImageCoords(
                f.x + f.width,
                f.y + f.height,
                canvasWidth,
                canvasHeight,
                actualImageWidth,
                actualImageHeight
              );
              const imageWidth = Math.round(
                Math.abs(bottomRight.x - topLeft.x)
              );
              const imageHeight = Math.round(
                Math.abs(bottomRight.y - topLeft.y)
              );

              // For QR codes, use the larger dimension to maintain square
              const qrSize = Math.max(imageWidth, imageHeight);

              const fieldData: {
                name: string;
                type: string;
                coordinates: {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                };
                qrCodeStyling?: unknown;
              } = {
                name: f.name,
                type: f.type,
                coordinates: {
                  x: Math.round(topLeft.x),
                  y: Math.round(topLeft.y),
                  width: qrSize,
                  height: qrSize,
                },
              };
              // Only include qrCodeStyling if it exists and has content
              if (f.qrCodeStyling && Object.keys(f.qrCodeStyling).length > 0) {
                fieldData.qrCodeStyling = f.qrCodeStyling;
              }
              return fieldData;
            }

            const { scaleX, scaleY } = calculateImageScale(
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );

            const centerCanvasX = f.x + f.width / 2;
            const centerCanvasY = f.y + f.height / 2;

            const centerImage = convertCanvasToImageCoords(
              centerCanvasX,
              centerCanvasY,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );

            const imageCenterX = Math.round(centerImage.x);
            const imageCenterY = Math.round(centerImage.y);

            const topLeft = convertCanvasToImageCoords(
              f.x,
              f.y,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );
            const bottomRight = convertCanvasToImageCoords(
              f.x + f.width,
              f.y + f.height,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );
            const imageWidth = Math.round(Math.abs(bottomRight.x - topLeft.x));
            const imageHeight = Math.round(Math.abs(bottomRight.y - topLeft.y));

            const avgScale = (scaleX + scaleY) / 2;
            const canvasFontSize = f.fontSize || selectedFontSize;
            const scaledFontSize = Math.round(canvasFontSize * avgScale);

            const fieldData = {
              name: f.name,
              type: f.type,
              coordinates: {
                x: imageCenterX,
                y: imageCenterY,
                width: Math.max(1, imageWidth),
                height: Math.max(1, imageHeight),
              },
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: scaledFontSize,
              fontColor: f.fontColor || selectedFontColor,
              bold: f.bold === true, // Explicitly convert to boolean
              italic: f.italic === true, // Explicitly convert to boolean
            };
            console.log(
              `[Edit Template] Field with coordinates "${f.name}": bold=${fieldData.bold}, italic=${fieldData.italic}, original bold=${f.bold}, original italic=${f.italic}`
            );
            return fieldData;
          }

          const fieldData = {
            name: f.name,
            type: f.type,
            coordinates: undefined,
            fontFamily: f.fontFamily || selectedFontFamily,
            fontSize: f.fontSize || selectedFontSize,
            fontColor: f.fontColor || selectedFontColor,
            bold: f.bold === true, // Explicitly convert to boolean
            italic: f.italic === true, // Explicitly convert to boolean
          };
          console.log(
            `[Edit Template] Fallback field "${f.name}": bold=${fieldData.bold}, italic=${fieldData.italic}`
          );
          return fieldData;
        }),
        certificateImage,
        badgeImage,
      };

      // Debug: Log the template data being sent
      console.log(
        "[Edit Template] Sending template data:",
        JSON.stringify(templateData, null, 2)
      );
      console.log(
        "[Edit Template] Fields with bold/italic:",
        templateData.fields.map((f) => ({
          name: f.name,
          bold: "bold" in f ? f.bold : undefined,
          italic: "italic" in f ? f.italic : undefined,
        }))
      );

      const res = await fetch(`/api/v1/issuer/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const error = await res.json();
        setModalMessage(error.error || "Failed to update template");
        setShowErrorModal(true);
        return;
      }

      setModalMessage("Template updated successfully!");
      setShowSuccessModal(true);
      // Close modal and redirect after short delay
      setTimeout(() => {
        setShowSuccessModal(false);
        // Allow modal to close before navigation
        setTimeout(() => {
          router.push("/dashboard/issuer/templates");
        }, 100);
      }, 1500);
    } catch (error) {
      console.error("Error updating template:", error);
      setModalMessage("An error occurred while updating the template");
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <LoadingScreen
        message={loading ? "Loading template..." : "Loading session..."}
      />
    );
  }

  if (
    status === "unauthenticated" ||
    (status === "authenticated" &&
      (!session || session.user?.role !== "issuer"))
  ) {
    return null;
  }

  return (
    <>
      <GoogleFontsLoader />
      <div className="min-h-screen w-full bg-black relative">
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 overflow-x-hidden pt-20">
          <DashboardHeader
            userRole="issuer"
            userName={session?.user?.name || undefined}
          />

          <div className="flex mt-4">
            <DashboardSidebar userRole="issuer" />

            <main className="flex-1 md:ml-80 p-4 md:p-8">
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Edit Template
                  </h1>
                  <p className="text-muted-foreground">
                    Modify your credential template with custom fields and
                    images
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Sidebar - Configuration */}
                  <div className="lg:col-span-1 space-y-4">
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      {/* Template Name */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="template-name"
                          className="text-sm font-semibold"
                        >
                          Template Name
                        </Label>
                        <Input
                          id="template-name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., Professional Certificate"
                          className="bg-background/50"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="category"
                          className="text-sm font-semibold"
                        >
                          Category
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger
                            id="category"
                            className="bg-background/50"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="achievement">
                              Achievement
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {category !== "general" && (
                          <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Or enter custom category"
                            className="bg-background/50 text-xs"
                          />
                        )}
                      </div>

                      {/* Template Type */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">
                          Credential Type
                        </Label>
                        <div className="space-y-2">
                          {(["certificate", "badge", "both"] as const).map(
                            (type) => (
                              <div
                                key={type}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={templateType === type}
                                  onCheckedChange={() => setTemplateType(type)}
                                  id={type}
                                />
                                <Label
                                  htmlFor={type}
                                  className="font-normal capitalize cursor-pointer"
                                >
                                  {type}
                                </Label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Image Upload Section */}
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <h3 className="font-semibold text-foreground">
                        Upload Assets
                      </h3>

                      {/* Certificate Upload */}
                      {(templateType === "certificate" ||
                        templateType === "both") && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="certificate-upload"
                            className="text-sm"
                          >
                            Certificate Image
                          </Label>
                          <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-primary/50 transition-colors bg-background/30 cursor-pointer">
                            <input
                              type="file"
                              id="certificate-upload"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "certificate")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="certificate-upload"
                              className="cursor-pointer"
                            >
                              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {certificateImage
                                  ? "Change image"
                                  : "Upload certificate"}
                              </p>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Badge Upload */}
                      {(templateType === "badge" ||
                        templateType === "both") && (
                        <div className="space-y-2">
                          <Label htmlFor="badge-upload" className="text-sm">
                            Badge Image
                          </Label>
                          <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-primary/50 transition-colors bg-background/30 cursor-pointer">
                            <input
                              type="file"
                              id="badge-upload"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "badge")}
                              className="hidden"
                            />
                            <label
                              htmlFor="badge-upload"
                              className="cursor-pointer"
                            >
                              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {badgeImage ? "Change image" : "Upload badge"}
                              </p>
                            </label>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Field Management Card */}
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          Fields
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {fields.length} field{fields.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => addField("text")}
                          variant="outline"
                          className="w-full justify-start text-xs h-7"
                        >
                          + Add Text Field
                        </Button>
                        <Button
                          onClick={() => addField("email")}
                          variant="outline"
                          className="w-full justify-start text-xs h-7"
                        >
                          + Add Email Field
                        </Button>
                        <Button
                          onClick={() => {
                            // Check if Issue Date field already exists
                            const hasIssueDateField = fields.some(
                              (f) =>
                                f.type === "date" &&
                                f.name.toLowerCase().trim() === "issue date"
                            );
                            if (hasIssueDateField) {
                              setModalMessage(
                                "Issue Date field already exists. Only one Issue Date field is allowed."
                              );
                              setShowErrorModal(true);
                              return;
                            }
                            // Find Name field to copy styling from (mandatory field)
                            const nameField = fields.find(
                              (f) => f.name.toLowerCase().trim() === "name"
                            );
                            // Add Issue Date field without coordinates (not displayed on certificate)
                            // Copy styling from Name field if it exists, otherwise use selected styling
                            const issueDateField: TemplateField = {
                              id: `field-${Date.now()}`,
                              name: "Issue Date",
                              type: "date",
                              x: undefined,
                              y: undefined,
                              width: 0,
                              height: 0,
                              fontFamily:
                                nameField?.fontFamily || selectedFontFamily,
                              fontSize: nameField?.fontSize || selectedFontSize,
                              fontColor:
                                nameField?.fontColor || selectedFontColor,
                              bold: nameField?.bold ?? false,
                              italic: nameField?.italic ?? false,
                            };
                            setFields([...fields, issueDateField]);
                            setSelectedField(issueDateField.id);
                          }}
                          variant="outline"
                          className="w-full justify-start text-xs h-7"
                        >
                          + Add Issue Date Field
                        </Button>
                        <Button
                          onClick={() => {
                            // Check if Expiry Date field already exists
                            const hasExpiryDateField = fields.some(
                              (f) =>
                                f.type === "date" &&
                                f.name.toLowerCase().trim() === "expiry date"
                            );
                            if (hasExpiryDateField) {
                              setModalMessage(
                                "Expiry Date field already exists. Only one Expiry Date field is allowed."
                              );
                              setShowErrorModal(true);
                              return;
                            }
                            // Find Name field to copy styling from (mandatory field)
                            const nameField = fields.find(
                              (f) => f.name.toLowerCase().trim() === "name"
                            );
                            // Add Expiry Date field without coordinates (not displayed on certificate)
                            // Copy styling from Name field if it exists, otherwise use selected styling
                            const expiryDateField: TemplateField = {
                              id: `field-${Date.now()}`,
                              name: "Expiry Date",
                              type: "date",
                              x: undefined,
                              y: undefined,
                              width: 0,
                              height: 0,
                              fontFamily:
                                nameField?.fontFamily || selectedFontFamily,
                              fontSize: nameField?.fontSize || selectedFontSize,
                              fontColor:
                                nameField?.fontColor || selectedFontColor,
                              bold: nameField?.bold ?? false,
                              italic: nameField?.italic ?? false,
                            };
                            setFields([...fields, expiryDateField]);
                            setSelectedField(expiryDateField.id);
                          }}
                          variant="outline"
                          className="w-full justify-start text-xs h-7"
                        >
                          + Add Expiry Date Field
                        </Button>
                        <Button
                          onClick={() => {
                            // Check if QR code field already exists
                            const hasQRCodeField = fields.some(
                              (f) => f.type === "qr"
                            );
                            if (hasQRCodeField) {
                              setModalMessage(
                                "QR Code field already exists. Only one QR Code field is allowed."
                              );
                              setShowErrorModal(true);
                              return;
                            }
                            // Check if appropriate image is uploaded based on template type
                            const hasImage =
                              templateType === "certificate" ||
                              templateType === "both"
                                ? certificateImage && imageRef.current
                                : templateType === "badge" ||
                                  templateType === "both"
                                ? badgeImage && badgeImageRef.current
                                : false;

                            if (!canvasRef.current || !hasImage) {
                              const imageType =
                                templateType === "badge"
                                  ? "badge"
                                  : "certificate";
                              setModalMessage(
                                `Please upload a ${imageType} image first.`
                              );
                              setShowErrorModal(true);
                              return;
                            }
                            // Create QR code in center of canvas
                            const canvas = canvasRef.current;
                            const qrSize = 150; // Default QR code size
                            const x = (canvas.width - qrSize) / 2;
                            const y = (canvas.height - qrSize) / 2;

                            const qrCodeField: TemplateField = {
                              id: `field-${Date.now()}`,
                              name: "QR Code",
                              type: "qr",
                              x,
                              y,
                              width: qrSize,
                              height: qrSize,
                              fontFamily: selectedFontFamily,
                              fontSize: selectedFontSize,
                              fontColor: selectedFontColor,
                              bold: false,
                              italic: false,
                              // Initialize with default QR code styling - white background, primary color dots
                              qrCodeStyling: {
                                dotsType: "rounded",
                                dotsColor: "#f55971", // Primary color
                                dotsColorType: "single",
                                backgroundOptions: {
                                  color: "#FFFFFF", // White background by default
                                  colorType: "single",
                                },
                                cornersSquareOptions: {
                                  type: "extra-rounded",
                                  color: "#f55971", // Primary color
                                },
                                cornersDotOptions: {
                                  type: "dot",
                                  color: "#f55971", // Primary color
                                },
                                qrOptions: {
                                  errorCorrectionLevel: "H",
                                },
                              },
                            };
                            setFields([...fields, qrCodeField]);
                            setSelectedField(qrCodeField.id);
                          }}
                          variant="outline"
                          className="w-full justify-start text-xs h-7"
                        >
                          + Add QR Code
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        💡 Click on fields in the canvas to move them
                      </p>

                      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                        {fields.map((field) => {
                          // Format field info based on type and coordinates
                          let fieldInfo = "";
                          if (
                            field.type === "qr" &&
                            field.x !== undefined &&
                            field.y !== undefined
                          ) {
                            // QR codes show position and size
                            fieldInfo = `qr • (${Math.round(
                              field.x
                            )}, ${Math.round(field.y)}) • ${Math.round(
                              field.width
                            )}×${Math.round(field.height)}`;
                          } else if (
                            field.x !== undefined &&
                            field.y !== undefined
                          ) {
                            // Other fields with coordinates show position
                            fieldInfo = `${field.type} • (${Math.round(
                              field.x
                            )}, ${Math.round(field.y)})`;
                          } else {
                            // Fields without coordinates
                            fieldInfo = `${field.type} • (Not displayed)`;
                          }

                          return (
                            <div
                              key={field.id}
                              onClick={() => setSelectedField(field.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                selectedField === field.id
                                  ? "bg-primary/20 border border-primary"
                                  : "bg-background/50 border border-border/50 hover:bg-background/70"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-sm text-foreground">
                                  {field.name}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteField(field.id);
                                  }}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {fieldInfo}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {fields.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No fields added yet
                        </p>
                      )}
                    </Card>

                    {/* Save Button */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push("/dashboard/issuer/templates")
                        }
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <PrimaryButton
                        onClick={handleUpdateTemplate}
                        disabled={saving}
                        className="flex-1 gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save
                          </>
                        )}
                      </PrimaryButton>
                    </div>
                  </div>

                  {/* Right Side - Canvas */}
                  <div className="lg:col-span-3 space-y-4">
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                          Template Canvas
                        </h2>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        💡 Note: Click on fields in the canvas to move them
                      </p>

                      {/* Formatting Toolbar - Header Style */}
                      {selectedField &&
                        certificateImage &&
                        fields.find((f) => f.id === selectedField)?.x !==
                          undefined &&
                        fields.find((f) => f.id === selectedField)?.y !==
                          undefined && (
                          <div className="flex items-center gap-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 py-2">
                            {/* Show font controls only for non-QR fields */}
                            {fields.find((f) => f.id === selectedField)
                              ?.type !== "qr" && (
                              <>
                                <div className="flex items-center gap-2 flex-1">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    Font:
                                  </Label>
                                  <Select
                                    value={
                                      fields.find((f) => f.id === selectedField)
                                        ?.fontFamily || selectedFontFamily
                                    }
                                    onValueChange={(value) => {
                                      if (selectedField) {
                                        setFields(
                                          fields.map((f) =>
                                            f.id === selectedField
                                              ? { ...f, fontFamily: value }
                                              : f
                                          )
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent border-border/50">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                      {GOOGLE_FONTS.map((font) => (
                                        <SelectItem
                                          key={font}
                                          value={font}
                                          style={{ fontFamily: font }}
                                        >
                                          {font}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    Size:
                                  </Label>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      min="8"
                                      max="72"
                                      value={
                                        fields.find(
                                          (f) => f.id === selectedField
                                        )?.fontSize || selectedFontSize
                                      }
                                      onChange={(e) => {
                                        const size =
                                          parseInt(e.target.value) || 16;
                                        if (selectedField) {
                                          setFields(
                                            fields.map((f) =>
                                              f.id === selectedField
                                                ? { ...f, fontSize: size }
                                                : f
                                            )
                                          );
                                        }
                                      }}
                                      className="h-8 w-16 text-xs bg-background border-2 border-border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      px
                                    </span>
                                  </div>
                                </div>

                                <ColorPickerComponent
                                  label="Color:"
                                  value={
                                    fields.find((f) => f.id === selectedField)
                                      ?.fontColor || selectedFontColor
                                  }
                                  onChange={(color) => {
                                    if (selectedField) {
                                      setFields(
                                        fields.map((f) =>
                                          f.id === selectedField
                                            ? { ...f, fontColor: color }
                                            : f
                                        )
                                      );
                                    }
                                  }}
                                />

                                <div className="flex items-center gap-1 border-l border-border/50 pl-3">
                                  <Button
                                    type="button"
                                    variant={
                                      fields.find((f) => f.id === selectedField)
                                        ?.bold
                                        ? "secondary"
                                        : "ghost"
                                    }
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${
                                      fields.find((f) => f.id === selectedField)
                                        ?.bold
                                        ? "bg-primary/20 text-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      if (selectedField) {
                                        const currentField = fields.find(
                                          (f) => f.id === selectedField
                                        );
                                        setFields(
                                          fields.map((f) =>
                                            f.id === selectedField
                                              ? {
                                                  ...f,
                                                  bold: !(
                                                    currentField?.bold || false
                                                  ),
                                                }
                                              : f
                                          )
                                        );
                                      }
                                    }}
                                    title="Bold"
                                  >
                                    <Bold className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={
                                      fields.find((f) => f.id === selectedField)
                                        ?.italic
                                        ? "secondary"
                                        : "ghost"
                                    }
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${
                                      fields.find((f) => f.id === selectedField)
                                        ?.italic
                                        ? "bg-primary/20 text-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      if (selectedField) {
                                        const currentField = fields.find(
                                          (f) => f.id === selectedField
                                        );
                                        setFields(
                                          fields.map((f) =>
                                            f.id === selectedField
                                              ? {
                                                  ...f,
                                                  italic: !(
                                                    currentField?.italic ||
                                                    false
                                                  ),
                                                }
                                              : f
                                          )
                                        );
                                      }
                                    }}
                                    title="Italic"
                                  >
                                    <Italic className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}

                            {/* QR Code Customization in Toolbar */}
                            {fields.find((f) => f.id === selectedField)
                              ?.type === "qr" && (
                              <>
                                <div className="flex items-center gap-2 border-l border-border/50 pl-3">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    Dot Type:
                                  </Label>
                                  <Select
                                    value={
                                      fields.find((f) => f.id === selectedField)
                                        ?.qrCodeStyling?.dotsType || "rounded"
                                    }
                                    onValueChange={(
                                      value:
                                        | "square"
                                        | "rounded"
                                        | "dots"
                                        | "classy"
                                        | "classy-rounded"
                                        | "extra-rounded"
                                    ) => {
                                      const currentField = fields.find(
                                        (f) => f.id === selectedField
                                      );
                                      if (currentField) {
                                        const updatedFields = fields.map((f) =>
                                          f.id === selectedField
                                            ? {
                                                ...f,
                                                qrCodeStyling: {
                                                  ...f.qrCodeStyling,
                                                  dotsType: value,
                                                },
                                              }
                                            : f
                                        );
                                        setFields(updatedFields);
                                        qrCodeImagesRef.current.delete(
                                          selectedField
                                        );
                                        drawCanvas();
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[120px] text-xs bg-transparent border-border/50">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="square">
                                        Square
                                      </SelectItem>
                                      <SelectItem value="rounded">
                                        Rounded
                                      </SelectItem>
                                      <SelectItem value="dots">Dots</SelectItem>
                                      <SelectItem value="classy">
                                        Classy
                                      </SelectItem>
                                      <SelectItem value="classy-rounded">
                                        Classy Rounded
                                      </SelectItem>
                                      <SelectItem value="extra-rounded">
                                        Extra Rounded
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center gap-2 border-l border-border/50 pl-3">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    Dots:
                                  </Label>
                                  <ColorPickerComponent
                                    value={(() => {
                                      const field = fields.find(
                                        (f) => f.id === selectedField
                                      );
                                      return (
                                        field?.qrCodeStyling?.dotsColor ||
                                        field?.qrCodeStyling
                                          ?.cornersSquareOptions?.color ||
                                        "#f55971"
                                      );
                                    })()}
                                    onChange={(color) => {
                                      const currentField = fields.find(
                                        (f) => f.id === selectedField
                                      );
                                      if (currentField) {
                                        const updatedFields = fields.map((f) =>
                                          f.id === selectedField
                                            ? {
                                                ...f,
                                                qrCodeStyling: {
                                                  ...(f.qrCodeStyling || {}),
                                                  dotsType:
                                                    f.qrCodeStyling?.dotsType ||
                                                    "rounded",
                                                  dotsColor: color,
                                                  dotsColorType:
                                                    "single" as const,
                                                  // Also update corners to match dots color
                                                  cornersSquareOptions: {
                                                    ...f.qrCodeStyling
                                                      ?.cornersSquareOptions,
                                                    type:
                                                      f.qrCodeStyling
                                                        ?.cornersSquareOptions
                                                        ?.type ||
                                                      "extra-rounded",
                                                    color: color,
                                                  },
                                                  cornersDotOptions: {
                                                    ...f.qrCodeStyling
                                                      ?.cornersDotOptions,
                                                    type:
                                                      f.qrCodeStyling
                                                        ?.cornersDotOptions
                                                        ?.type || "dot",
                                                    color: color,
                                                  },
                                                  backgroundOptions: f
                                                    .qrCodeStyling
                                                    ?.backgroundOptions || {
                                                    color: "#FFFFFF",
                                                    colorType:
                                                      "single" as const,
                                                  },
                                                  qrOptions: f.qrCodeStyling
                                                    ?.qrOptions || {
                                                    errorCorrectionLevel:
                                                      "H" as const,
                                                  },
                                                },
                                              }
                                            : f
                                        );
                                        setFields(updatedFields);
                                        qrCodeImagesRef.current.delete(
                                          selectedField
                                        );
                                        drawCanvas();
                                      }
                                    }}
                                  />
                                </div>

                                <div className="flex items-center gap-2 border-l border-border/50 pl-3">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    BG:
                                  </Label>
                                  <ColorPickerComponent
                                    value={(() => {
                                      const field = fields.find(
                                        (f) => f.id === selectedField
                                      );
                                      // If gradient, show the base color, otherwise show the color
                                      if (
                                        field?.qrCodeStyling?.backgroundOptions
                                          ?.colorType === "gradient"
                                      ) {
                                        return (
                                          field.qrCodeStyling.backgroundOptions
                                            .color || "#FFFFFF"
                                        );
                                      }
                                      return (
                                        field?.qrCodeStyling?.backgroundOptions
                                          ?.color || "#FFFFFF"
                                      );
                                    })()}
                                    onChange={(color) => {
                                      const currentField = fields.find(
                                        (f) => f.id === selectedField
                                      );
                                      if (currentField) {
                                        const updatedFields = fields.map((f) =>
                                          f.id === selectedField
                                            ? {
                                                ...f,
                                                qrCodeStyling: {
                                                  ...(f.qrCodeStyling || {}),
                                                  dotsType:
                                                    f.qrCodeStyling?.dotsType ||
                                                    "rounded",
                                                  dotsColor:
                                                    f.qrCodeStyling
                                                      ?.dotsColor || "#000000",
                                                  dotsColorType: (f
                                                    .qrCodeStyling
                                                    ?.dotsColorType ||
                                                    "single") as
                                                    | "single"
                                                    | "gradient",
                                                  cornersSquareOptions: f
                                                    .qrCodeStyling
                                                    ?.cornersSquareOptions || {
                                                    type: "extra-rounded" as const,
                                                    color:
                                                      f.qrCodeStyling
                                                        ?.dotsColor ||
                                                      "#000000",
                                                  },
                                                  cornersDotOptions: f
                                                    .qrCodeStyling
                                                    ?.cornersDotOptions || {
                                                    type: "dot" as const,
                                                    color:
                                                      f.qrCodeStyling
                                                        ?.dotsColor ||
                                                      "#000000",
                                                  },
                                                  backgroundOptions: {
                                                    ...f.qrCodeStyling
                                                      ?.backgroundOptions,
                                                    color,
                                                    colorType:
                                                      "single" as const,
                                                    // Remove gradient when setting solid color
                                                    gradient: undefined,
                                                  },
                                                  qrOptions: f.qrCodeStyling
                                                    ?.qrOptions || {
                                                    errorCorrectionLevel:
                                                      "H" as const,
                                                  },
                                                },
                                              }
                                            : f
                                        );
                                        setFields(updatedFields);
                                        qrCodeImagesRef.current.delete(
                                          selectedField
                                        );
                                        drawCanvas();
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                      {/* Canvas */}
                      <div
                        className={`border border-border/50 rounded-lg overflow-hidden bg-black/50 ${
                          certificateImage
                            ? "cursor-crosshair"
                            : "cursor-default"
                        } ${!certificateImage ? "opacity-50" : ""}`}
                      >
                        <canvas
                          ref={canvasRef}
                          width={CANVAS_WIDTH}
                          height={CANVAS_HEIGHT}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={() => {
                            if (isMovingField) {
                              setIsMovingField(false);
                              setMovingFieldId(null);
                            }
                          }}
                          className="w-full border-b border-border/50"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Hidden images for loading */}
        {certificateImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={certificateImage}
            alt="Certificate"
            className="hidden"
            onLoad={drawCanvas}
            crossOrigin="anonymous"
          />
        )}

        {/* Add New Field Dialog */}
        <Dialog open={showNewField} onOpenChange={setShowNewField}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
              <DialogDescription>
                Enter a name and type for the new field you created.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {newFieldType !== "qr" && (
                <div className="space-y-2">
                  <Label htmlFor="new-field-name">Field Name *</Label>
                  <Input
                    id="new-field-name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="e.g., Recipient Name"
                    autoFocus
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-field-type">Field Type</Label>
                <Select
                  value={newFieldType}
                  onValueChange={(
                    value: "text" | "email" | "number" | "date" | "id" | "qr"
                  ) => {
                    setNewFieldType(value);
                    // Auto-set name to "QR Code" when QR Code type is selected
                    if (value === "qr") {
                      setNewFieldName("QR Code");
                    }
                  }}
                >
                  <SelectTrigger id="new-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newFieldType === "qr" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Field name will be automatically set to &quot;QR Code&quot;
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewField(false);
                  setPendingField(null);
                  setNewFieldName("");
                  setNewFieldType("text");
                }}
              >
                Cancel
              </Button>
              <PrimaryButton
                onClick={handleAddNewField}
                disabled={newFieldType !== "qr" && !newFieldName.trim()}
              >
                Add Field
              </PrimaryButton>
            </div>
          </DialogContent>
        </Dialog>

        {/* Error Modal */}
        <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Error</DialogTitle>
              <DialogDescription>{modalMessage}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorModal(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">Success</DialogTitle>
              <DialogDescription>{modalMessage}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
