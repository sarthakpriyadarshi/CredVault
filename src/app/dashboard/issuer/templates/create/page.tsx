"use client";

import type React from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
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
import {
  Upload,
  Trash2,
  Download,
  Save,
  Eye,
  Bold,
  Italic,
} from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { GOOGLE_FONTS } from "@/lib/fonts";
import { ColorPickerComponent } from "@/components/ui/color-picker";
import { generateDummyQRCodeBrowser } from "@/lib/qrcode/browser-generator";
import { IQRCodeStyling } from "@/models/Template";
import { GoogleFontsLoader } from "@/components/google-fonts-loader";

interface TemplateField {
  id: string;
  name: string;
  type: "text" | "email" | "number" | "date" | "id" | "qr";
  x?: number; // Optional - email and expiry date fields may not have coordinates if not displayed. For QR codes, this is the top-left x coordinate
  y?: number; // Optional - email and expiry date fields may not have coordinates if not displayed. For QR codes, this is the top-left y coordinate
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  qrCodeStyling?: IQRCodeStyling; // QR code styling options (only for QR type fields)
}

export default function CreateTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("general");
  const [templateType, setTemplateType] = useState<
    "certificate" | "badge" | "both"
  >("certificate");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [badgeImage, setBadgeImage] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "text" | "email" | "number" | "date" | "id" | "qr"
  >("text");
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [pendingField, setPendingField] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isMovingField, setIsMovingField] = useState(false);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);
  const [fieldDragOffset, setFieldDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    fieldX: 0,
    fieldY: 0,
    fieldWidth: 0,
    fieldHeight: 0,
  });
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const badgeImageRef = useRef<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"certificate" | "badge">(
    "certificate"
  );
  const animationFrameRef = useRef<number | null>(null);
  const qrCodeImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState<number>(16);
  const [selectedFontColor, setSelectedFontColor] = useState<string>("#FFFFFF");

  // Modal states for error and success messages
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Use shared Google Fonts list
  const googleFonts = GOOGLE_FONTS;

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
    }
  }, [session, status, router]);

  // Load image when certificateImage changes (can be URL or base64)
  useEffect(() => {
    if (certificateImage) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        console.error("Failed to load certificate image");
        imageRef.current = null;
        drawCanvas();
      };
      // Handle both URLs and base64 data URLs
      img.src = certificateImage.startsWith("/")
        ? `${window.location.origin}${certificateImage}`
        : certificateImage;
    } else {
      imageRef.current = null;
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateImage]);

  // Load image when badgeImage changes (can be URL or base64)
  useEffect(() => {
    if (badgeImage) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        badgeImageRef.current = img;
        drawCanvas();
      };
      img.onerror = () => {
        console.error("Failed to load badge image");
        badgeImageRef.current = null;
        drawCanvas();
      };
      // Handle both URLs and base64 data URLs
      img.src = badgeImage.startsWith("/")
        ? `${window.location.origin}${badgeImage}`
        : badgeImage;
    } else {
      badgeImageRef.current = null;
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeImage]);

  // Auto-switch to badge tab when templateType is badge-only
  useEffect(() => {
    if (templateType === "badge") {
      setActiveTab("badge");
    } else if (templateType === "certificate") {
      setActiveTab("certificate");
    }
  }, [templateType]);

  // Draw canvas when fields or state changes (but use requestAnimationFrame to prevent flickering)
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas();
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fields,
    selectedField,
    isDragging,
    dragStart,
    dragCurrent,
    isMovingField,
    isResizing,
    previewMode,
    selectedFontFamily,
    selectedFontSize,
    selectedFontColor,
    activeTab,
    templateType,
    certificateImage,
    badgeImage,
  ]);

  // Helper function to get resize handle position
  const getResizeHandlePosition = useCallback(
    (field: TemplateField, handle: string): { x: number; y: number } => {
      if (field.x === undefined || field.y === undefined) {
        return { x: 0, y: 0 };
      }
      const handleSize = 8;
      const halfHandle = handleSize / 2;
      switch (handle) {
        case "nw":
          return { x: field.x - halfHandle, y: field.y - halfHandle }; // top-left
        case "n":
          return {
            x: field.x + field.width / 2 - halfHandle,
            y: field.y - halfHandle,
          }; // top-center
        case "ne":
          return {
            x: field.x + field.width - halfHandle,
            y: field.y - halfHandle,
          }; // top-right
        case "w":
          return {
            x: field.x - halfHandle,
            y: field.y + field.height / 2 - halfHandle,
          }; // middle-left
        case "e":
          return {
            x: field.x + field.width - halfHandle,
            y: field.y + field.height / 2 - halfHandle,
          }; // middle-right
        case "sw":
          return {
            x: field.x - halfHandle,
            y: field.y + field.height - halfHandle,
          }; // bottom-left
        case "s":
          return {
            x: field.x + field.width / 2 - halfHandle,
            y: field.y + field.height - halfHandle,
          }; // bottom-center
        case "se":
          return {
            x: field.x + field.width - halfHandle,
            y: field.y + field.height - halfHandle,
          }; // bottom-right
        default:
          return { x: 0, y: 0 };
      }
    },
    []
  );

  // Helper function to detect which resize handle is clicked
  const getResizeHandleAt = useCallback(
    (field: TemplateField, x: number, y: number): string | null => {
      const handleSize = 8;
      const handles = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

      for (const handle of handles) {
        const pos = getResizeHandlePosition(field, handle);
        if (
          x >= pos.x &&
          x <= pos.x + handleSize &&
          y >= pos.y &&
          y <= pos.y + handleSize
        ) {
          return handle;
        }
      }
      return null;
    },
    [getResizeHandlePosition]
  );

  // Helper function to calculate maximum font size that fits within field dimensions
  const calculateMaxFontSize = useCallback(
    (
      field: TemplateField,
      text: string,
      fontFamily: string,
      isBold: boolean,
      isItalic: boolean
    ): number => {
      if (
        !canvasRef.current ||
        field.x === undefined ||
        field.y === undefined
      ) {
        return 72; // Default max
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return 72;

      // Use a reasonable padding to ensure text doesn't touch edges
      const padding = 4;
      const maxWidth = field.width - padding * 2;
      const maxHeight = field.height - padding * 2;

      // Binary search for maximum font size that fits
      let minSize = 8;
      let maxSize = 200; // Reasonable upper limit
      let bestSize = minSize;

      while (minSize <= maxSize) {
        const testSize = Math.floor((minSize + maxSize) / 2);

        // Build font string
        let fontStyle = "";
        if (isBold && isItalic) {
          fontStyle = "bold italic ";
        } else if (isBold) {
          fontStyle = "bold ";
        } else if (isItalic) {
          fontStyle = "italic ";
        }
        ctx.font = `${fontStyle}${testSize}px "${fontFamily}", sans-serif`;

        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        // Approximate text height (font size is usually close to actual height)
        const textHeight = testSize * 1.2; // Add some buffer for descenders/ascenders

        if (textWidth <= maxWidth && textHeight <= maxHeight) {
          bestSize = testSize;
          minSize = testSize + 1;
        } else {
          maxSize = testSize - 1;
        }
      }

      return Math.min(bestSize, 72); // Cap at 72px
    },
    []
  );

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Disable interactions when badge tab is active (badge is non-editable)
    const isBadgeActive =
      (activeTab === "badge" &&
        (templateType === "badge" || templateType === "both")) ||
      templateType === "badge";
    if (!canvasRef.current || previewMode || !certificateImage || isBadgeActive)
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    // Check if clicking on a resize handle first
    if (selectedField) {
      const selectedFieldObj = fields.find(
        (f) => f.id === selectedField && f.x !== undefined && f.y !== undefined
      );
      if (selectedFieldObj) {
        const handle = getResizeHandleAt(selectedFieldObj, x, y);
        if (handle) {
          setIsResizing(true);
          setResizingFieldId(selectedField);
          setResizeHandle(handle);
          setResizeStart({
            x,
            y,
            fieldX: selectedFieldObj.x!,
            fieldY: selectedFieldObj.y!,
            fieldWidth: selectedFieldObj.width,
            fieldHeight: selectedFieldObj.height,
          });
          return;
        }
      }
    }

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

    // Start dragging to create new field (no dialog needed)
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setSelectedField(null);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      // Disable interactions if no certificate image is uploaded
      if (!certificateImage) {
        canvasRef.current.style.cursor = "default";
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const currentX =
        (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
      const currentY =
        (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

      if (isResizing && resizingFieldId && resizeHandle) {
        // Update field dimensions based on resize handle
        setFields((prevFields) => {
          const field = prevFields.find((f) => f.id === resizingFieldId);
          if (!field || field.x === undefined || field.y === undefined)
            return prevFields;

          const deltaX = currentX - resizeStart.x;
          const deltaY = currentY - resizeStart.y;
          let newX = resizeStart.fieldX;
          let newY = resizeStart.fieldY;
          let newWidth = resizeStart.fieldWidth;
          let newHeight = resizeStart.fieldHeight;

          // For QR codes, maintain square aspect ratio
          const resizingField = prevFields.find(
            (f) => f.id === resizingFieldId
          );
          const isQRCode = resizingField?.type === "qr";

          if (isQRCode) {
            // For QR codes, use the larger dimension to maintain square
            if (resizeHandle.includes("w") || resizeHandle.includes("e")) {
              newWidth = Math.max(50, resizeStart.fieldWidth + deltaX);
              newHeight = newWidth; // Keep square
              if (resizeHandle.includes("w")) {
                newX = resizeStart.fieldX + resizeStart.fieldWidth - newWidth;
              }
            } else if (
              resizeHandle.includes("n") ||
              resizeHandle.includes("s")
            ) {
              newHeight = Math.max(50, resizeStart.fieldHeight + deltaY);
              newWidth = newHeight; // Keep square
              if (resizeHandle.includes("n")) {
                newY = resizeStart.fieldY + resizeStart.fieldHeight - newHeight;
              }
            } else {
              // Corner handles - use average of both deltas
              const size = Math.max(
                50,
                resizeStart.fieldWidth + (deltaX + deltaY) / 2
              );
              newWidth = size;
              newHeight = size;
              if (resizeHandle.includes("w")) {
                newX = resizeStart.fieldX + resizeStart.fieldWidth - size;
              }
              if (resizeHandle.includes("n")) {
                newY = resizeStart.fieldY + resizeStart.fieldHeight - size;
              }
            }
          } else {
            // Handle different resize directions for regular fields
            if (resizeHandle.includes("w")) {
              // Left edge
              newX = Math.max(0, resizeStart.fieldX + deltaX);
              newWidth = Math.max(50, resizeStart.fieldWidth - deltaX);
            }
            if (resizeHandle.includes("e")) {
              // Right edge
              newWidth = Math.max(50, resizeStart.fieldWidth + deltaX);
            }
            if (resizeHandle.includes("n")) {
              // Top edge
              newY = Math.max(0, resizeStart.fieldY + deltaY);
              newHeight = Math.max(20, resizeStart.fieldHeight - deltaY);
            }
            if (resizeHandle.includes("s")) {
              // Bottom edge
              newHeight = Math.max(20, resizeStart.fieldHeight + deltaY);
            }
          }

          // Ensure field stays within canvas bounds
          newX = Math.max(
            0,
            Math.min(newX, canvasRef.current!.width - newWidth)
          );
          newY = Math.max(
            0,
            Math.min(newY, canvasRef.current!.height - newHeight)
          );
          newWidth = Math.min(newWidth, canvasRef.current!.width - newX);
          newHeight = Math.min(newHeight, canvasRef.current!.height - newY);

          return prevFields.map((f) => {
            if (f.id === resizingFieldId) {
              const updatedField = {
                ...f,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              };

              // Validate font size after resize - ensure it still fits
              if (updatedField.fontSize !== undefined) {
                const fontFamily =
                  updatedField.fontFamily || selectedFontFamily;
                const isBold = updatedField.bold || false;
                const isItalic = updatedField.italic || false;
                const maxSize = calculateMaxFontSize(
                  updatedField,
                  updatedField.name,
                  fontFamily,
                  isBold,
                  isItalic
                );

                // Only cap to maximum, allow smaller sizes (don't enforce minimum)
                if (updatedField.fontSize > maxSize) {
                  updatedField.fontSize = maxSize;
                }
              }

              return updatedField;
            }
            return f;
          });
        });

        // Update cursor based on resize handle
        const cursorMap: Record<string, string> = {
          nw: "nw-resize",
          n: "n-resize",
          ne: "ne-resize",
          w: "w-resize",
          e: "e-resize",
          sw: "sw-resize",
          s: "s-resize",
          se: "se-resize",
        };
        canvasRef.current.style.cursor = cursorMap[resizeHandle] || "default";
      } else if (isMovingField && movingFieldId) {
        // Update the field position in real-time (only for fields with coordinates)
        setFields((prevFields) => {
          const field = prevFields.find((f) => f.id === movingFieldId);
          if (field && field.x !== undefined && field.y !== undefined) {
            const newX = Math.max(
              0,
              Math.min(
                currentX - fieldDragOffset.x,
                canvasRef.current!.width - field.width
              )
            );
            const newY = Math.max(
              0,
              Math.min(
                currentY - fieldDragOffset.y,
                canvasRef.current!.height - field.height
              )
            );

            return prevFields.map((f) =>
              f.id === movingFieldId ? { ...f, x: newX, y: newY } : f
            );
          }
          return prevFields;
        });
        setDragCurrent({ x: currentX, y: currentY });
        canvasRef.current.style.cursor = "grabbing";
      } else if (isDragging) {
        setDragCurrent({ x: currentX, y: currentY });
        canvasRef.current.style.cursor = "crosshair";
      } else if (!previewMode) {
        // Check if hovering over a resize handle
        if (selectedField) {
          const selectedFieldObj = fields.find(
            (f) =>
              f.id === selectedField && f.x !== undefined && f.y !== undefined
          );
          if (selectedFieldObj) {
            const handle = getResizeHandleAt(
              selectedFieldObj,
              currentX,
              currentY
            );
            if (handle) {
              const cursorMap: Record<string, string> = {
                nw: "nw-resize",
                n: "n-resize",
                ne: "ne-resize",
                w: "w-resize",
                e: "e-resize",
                sw: "sw-resize",
                s: "s-resize",
                se: "se-resize",
              };
              canvasRef.current.style.cursor = cursorMap[handle] || "default";
              return;
            }
          }
        }

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
        canvasRef.current.style.cursor = hoveredField ? "grab" : "crosshair";
      } else {
        canvasRef.current.style.cursor = "default";
      }
    },
    [
      certificateImage,
      isMovingField,
      movingFieldId,
      fieldDragOffset,
      isDragging,
      previewMode,
      fields,
      isResizing,
      resizingFieldId,
      resizeHandle,
      resizeStart,
      selectedField,
      getResizeHandleAt,
      calculateMaxFontSize,
      selectedFontFamily,
    ]
  );

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      setIsDragging(false);
      setIsMovingField(false);
      setMovingFieldId(null);
      setIsResizing(false);
      setResizingFieldId(null);
      setResizeHandle(null);
      return;
    }

    // Handle field resizing
    if (isResizing && resizingFieldId) {
      setIsResizing(false);
      setResizingFieldId(null);
      setResizeHandle(null);
      canvasRef.current.style.cursor = "default";
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

  // Draw canvas with fields (optimized to prevent flickering)
  const drawCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Determine which image to show based on activeTab and templateType
    const showCertificate =
      (activeTab === "certificate" &&
        (templateType === "certificate" || templateType === "both")) ||
      templateType === "certificate";
    const showBadge =
      (activeTab === "badge" &&
        (templateType === "badge" || templateType === "both")) ||
      templateType === "badge";

    // Draw certificate image if available and should be shown
    if (showCertificate && imageRef.current) {
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
    }
    // Draw badge image if available and should be shown
    else if (showBadge && badgeImageRef.current) {
      const img = badgeImageRef.current;
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
      const previewText =
        templateType === "badge" ? "Badge Preview" : "Certificate Preview";
      ctx.fillText(previewText, canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(
        "Upload image above to see preview",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }

    // Only draw fields on top if showing certificate (badge is non-editable)
    if (showCertificate && !showBadge) {
      drawFields(ctx);
    }
  };

  const drawFields = (ctx: CanvasRenderingContext2D) => {
    fields.forEach((field) => {
      // Skip fields without coordinates (like email and expiry date fields that aren't displayed)
      if (field.x === undefined || field.y === undefined) {
        return;
      }

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
              const img = new window.Image();
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

      // Save context and set up clipping to prevent text overflow
      ctx.save();
      ctx.beginPath();
      ctx.rect(field.x, field.y, field.width, field.height);
      ctx.clip();

      // Calculate center position
      const centerX = field.x + field.width / 2;
      const centerY = field.y + field.height / 2;

      ctx.fillText(field.name, centerX, centerY);

      // Restore context to remove clipping
      ctx.restore();

      // Draw resize handles for selected fields
      if (isSelected && !previewMode) {
        const handleSize = 8;
        const handles = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

        ctx.fillStyle = "#DB2777";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;

        handles.forEach((handle) => {
          const pos = getResizeHandlePosition(field, handle);
          // Draw handle square
          ctx.fillRect(pos.x, pos.y, handleSize, handleSize);
          ctx.strokeRect(pos.x, pos.y, handleSize, handleSize);
        });
      }

      // Reset text alignment for other operations
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    });

    // Draw dragging rectangle in real-time
    if (isDragging) {
      const width = Math.max(Math.abs(dragCurrent.x - dragStart.x), 50);
      const height = Math.max(Math.abs(dragCurrent.y - dragStart.y), 20);
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);

      // Draw semi-transparent fill
      ctx.fillStyle = "rgba(219, 39, 119, 0.2)";
      ctx.fillRect(x, y, width, height);

      // Draw dashed border
      ctx.strokeStyle = "#DB2777";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);

      // Draw dimensions text
      ctx.fillStyle = "#DB2777";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "left";
      const dimText = `${Math.round(width)} × ${Math.round(height)}`;
      ctx.fillText(dimText, x + 5, y - 5);
    }
  };

  // Handle file upload - upload to server and get URL
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "certificate" | "badge"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "template-image");
      formData.append("imageType", type);
      const res = await fetch("/api/v1/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        setModalMessage(error.error || "Failed to upload image");
        setShowErrorModal(true);
        return;
      }

      const data = await res.json();

      // Store the base64 data URL
      if (type === "certificate") {
        setCertificateImage(data.base64);
      } else {
        setBadgeImage(data.base64);
      }

      // Image will be loaded by the useEffect that watches certificateImage
    } catch (error) {
      console.error("Error uploading image:", error);
      setModalMessage("An error occurred while uploading the image");
      setShowErrorModal(true);
    }
  };

  // Update field position (only for fields with coordinates)
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
        let fontSize = nameField.fontSize || selectedFontSize;

        // If field has coordinates, validate font size to prevent overflow
        if (f.x !== undefined && f.y !== undefined) {
          const fontFamily = nameField.fontFamily || selectedFontFamily;
          const isBold = nameField.bold || false;
          const isItalic = nameField.italic || false;
          const maxSize = calculateMaxFontSize(
            f,
            f.name,
            fontFamily,
            isBold,
            isItalic
          );
          // Only cap to maximum - save exactly as propagated (no minimum enforcement)
          fontSize = Math.min(fontSize, maxSize);
        }

        return {
          ...f,
          fontFamily: nameField.fontFamily,
          fontSize,
          fontColor: nameField.fontColor,
          bold: nameField.bold,
          italic: nameField.italic,
        };
      }
      return f;
    });
  };

  const updateFieldPosition = (fieldId: string, dx: number, dy: number) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId && f.x !== undefined && f.y !== undefined) {
          return { ...f, x: Math.max(0, f.x + dx), y: Math.max(0, f.y + dy) };
        }
        return f;
      })
    );
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    setSelectedField(null);
  };

  // Helper function to calculate scale factor from canvas to actual image
  const calculateImageScale = (
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ): {
    scaleX: number;
    scaleY: number;
    displayWidth: number;
    displayHeight: number;
  } => {
    // Calculate how the image is displayed on canvas (same logic as drawCanvas)
    const maxWidth = canvasWidth;
    const maxHeight = canvasHeight;
    let displayWidth = imageWidth;
    let displayHeight = imageHeight;

    let scale = 1;

    // If image is larger than canvas, it's scaled down
    if (displayWidth > maxWidth || displayHeight > maxHeight) {
      scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
      displayWidth *= scale;
      displayHeight *= scale;
    }

    // Calculate scale factors from displayed size to actual image size
    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;

    return {
      scaleX,
      scaleY,
      displayWidth,
      displayHeight,
    };
  };

  // Helper function to convert canvas coordinates to actual image coordinates
  const convertCanvasToImageCoords = (
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number; scaleX: number; scaleY: number } => {
    const { scaleX, scaleY, displayWidth, displayHeight } = calculateImageScale(
      canvasWidth,
      canvasHeight,
      imageWidth,
      imageHeight
    );

    // Calculate centering offset
    const offsetX = (canvasWidth - displayWidth) / 2;
    const offsetY = (canvasHeight - displayHeight) / 2;

    // Convert canvas coordinates to displayed image coordinates
    let imageX = canvasX - offsetX;
    let imageY = canvasY - offsetY;

    // Clamp to displayed image bounds
    imageX = Math.max(0, Math.min(imageX, displayWidth));
    imageY = Math.max(0, Math.min(imageY, displayHeight));

    // Scale to actual image dimensions
    const finalX = (imageX / displayWidth) * imageWidth;
    const finalY = (imageY / displayHeight) * imageHeight;

    return {
      x: finalX,
      y: finalY,
      scaleX,
      scaleY,
    };
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setModalMessage("Please enter a template name");
      setShowErrorModal(true);
      return;
    }

    // Check if email field exists
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
      if (!badgeImage) {
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

      const canvasWidth = canvas.width; // 800
      const canvasHeight = canvas.height; // 600
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
              `[Create Template] ${
                isEmailField ? "Email" : "Expiry Date"
              } field "${f.name}": bold=${fieldData.bold}, italic=${
                fieldData.italic
              }`
            );
            return fieldData;
          }

          // Convert coordinates from canvas space to actual image space
          if (f.x !== undefined && f.y !== undefined) {
            // Handle QR code fields differently - store top-left corner and size
            if (f.type === "qr") {
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

            // Get scale factor for this image
            const { scaleX, scaleY } = calculateImageScale(
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );

            // Calculate center of the field box (where text is displayed)
            const centerCanvasX = f.x + f.width / 2;
            const centerCanvasY = f.y + f.height / 2;

            // Convert center coordinates to actual image space
            const centerImage = convertCanvasToImageCoords(
              centerCanvasX,
              centerCanvasY,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            );

            // Store center coordinates (this matches where text is drawn on canvas)
            // Note: We still store width/height for reference, but x/y will be the center
            const imageCenterX = Math.round(centerImage.x);
            const imageCenterY = Math.round(centerImage.y);

            // Also convert corners to preserve box dimensions
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

            // Scale font size proportionally to image scale
            // Use average scale to maintain aspect ratio for font size
            const avgScale = (scaleX + scaleY) / 2;
            const canvasFontSize = f.fontSize || selectedFontSize;
            const scaledFontSize = Math.round(canvasFontSize * avgScale);

            const fieldData = {
              name: f.name,
              type: f.type,
              coordinates: {
                x: imageCenterX, // Center X coordinate
                y: imageCenterY, // Center Y coordinate
                width: Math.max(1, imageWidth), // Box width for reference
                height: Math.max(1, imageHeight), // Box height for reference
              },
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: scaledFontSize, // Scaled font size relative to image
              fontColor: f.fontColor || selectedFontColor,
              bold: f.bold === true, // Explicitly convert to boolean
              italic: f.italic === true, // Explicitly convert to boolean
            };
            console.log(
              `[Create Template] Field with coordinates "${f.name}": bold=${fieldData.bold}, italic=${fieldData.italic}, original bold=${f.bold}, original italic=${f.italic}`
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
            `[Create Template] Fallback field "${f.name}": bold=${fieldData.bold}, italic=${fieldData.italic}`
          );
          return fieldData;
        }),
        certificateImage,
        badgeImage,
      };

      // Debug: Log the template data being sent
      console.log(
        "[Create Template] Sending template data:",
        JSON.stringify(templateData, null, 2)
      );
      console.log(
        "[Create Template] Fields with bold/italic:",
        templateData.fields.map((f) => ({
          name: f.name,
          type: f.type,
          bold: "bold" in f ? f.bold : undefined,
          italic: "italic" in f ? f.italic : undefined,
        }))
      );

      const res = await fetch("/api/v1/issuer/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const error = await res.json();
        setModalMessage(error.error || "Failed to save template");
        setShowErrorModal(true);
        return;
      }

      setModalMessage("Template saved successfully!");
      setShowSuccessModal(true);
      // Close modal after short delay, then redirect
      setTimeout(() => {
        setShowSuccessModal(false);
        // Wait for modal unmount animation before navigation
        setTimeout(() => {
          router.push("/dashboard/issuer/templates");
        }, 300);
      }, 1500);
    } catch (error) {
      console.error("Error saving template:", error);
      setModalMessage("An error occurred while saving the template");
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
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
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
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
                    Create Template
                  </h1>
                  <p className="text-muted-foreground">
                    Design your credential template with custom fields and
                    upload images
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
                          Template Name *
                        </Label>
                        <Input
                          id="template-name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., Professional Certificate"
                          className="bg-background/50"
                          required
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
                              <label
                                key={type}
                                htmlFor={type}
                                className="flex items-center gap-3 cursor-pointer"
                              >
                                <Checkbox
                                  checked={templateType === type}
                                  onCheckedChange={() => setTemplateType(type)}
                                  id={type}
                                />
                                <span className="font-normal capitalize flex-1">
                                  {type}
                                </span>
                              </label>
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
                          <Label className="text-sm font-semibold">
                            Certificate Image (PDF/PNG)
                          </Label>
                          <label className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="text-center">
                              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Click to upload
                              </p>
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) =>
                                handleImageUpload(e, "certificate")
                              }
                              className="hidden"
                            />
                          </label>
                          {certificateImage && (
                            <p className="text-xs text-emerald-500">
                              ✓ Certificate uploaded
                            </p>
                          )}
                        </div>
                      )}

                      {/* Badge Upload */}
                      {(templateType === "badge" ||
                        templateType === "both") && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">
                            Badge Image (PNG)
                          </Label>
                          <label className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="text-center">
                              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Click to upload
                              </p>
                            </div>
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              onChange={(e) => handleImageUpload(e, "badge")}
                              className="hidden"
                            />
                          </label>
                          {badgeImage && (
                            <p className="text-xs text-emerald-500">
                              ✓ Badge uploaded
                            </p>
                          )}
                        </div>
                      )}
                    </Card>

                    {/* Fields List */}
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          Fields ({fields.length})
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Check if email field already exists
                            const hasEmailField = fields.some(
                              (f) => f.type === "email"
                            );
                            if (hasEmailField) {
                              setModalMessage(
                                "Email field already exists. Only one email field is allowed."
                              );
                              setShowErrorModal(true);
                              return;
                            }
                            // Add email field without coordinates (not displayed on certificate)
                            const emailField: TemplateField = {
                              id: Date.now().toString(),
                              name: "Email ID",
                              type: "email",
                              x: undefined,
                              y: undefined,
                              width: 0,
                              height: 0,
                              fontFamily: selectedFontFamily,
                              fontSize: selectedFontSize,
                              fontColor: selectedFontColor,
                              bold: false,
                              italic: false,
                            };
                            setFields([...fields, emailField]);
                            setSelectedField(emailField.id);
                          }}
                          className="text-xs h-7 w-full"
                        >
                          + Add Email Field
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
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
                              id: Date.now().toString(),
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
                          className="text-xs h-7 w-full"
                        >
                          + Add Issue Date Field
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
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
                              id: Date.now().toString(),
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
                          className="text-xs h-7 w-full"
                        >
                          + Add Expiry Date Field
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
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
                                ? badgeImage
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
                              id: Date.now().toString(),
                              name: "QR Code",
                              type: "qr",
                              x,
                              y,
                              width: qrSize,
                              height: qrSize,
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
                          className="text-xs h-7 w-full"
                        >
                          + Add QR Code
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        💡 Note: Drag on canvas to add fields, or use the
                        buttons above to add Email, Issue Date, Expiry Date, or
                        QR Code fields.
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

                    {/* Dialog for naming fields */}
                    <Dialog
                      open={showNewField}
                      onOpenChange={(open: boolean) => {
                        setShowNewField(open);
                        if (!open) {
                          setPendingField(null);
                        }
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Name Your Field</DialogTitle>
                          <DialogDescription>
                            Enter a name and type for the field you just drew on
                            the canvas
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {newFieldType !== "qr" && (
                            <div className="space-y-2">
                              <Label htmlFor="field-name">Field Name *</Label>
                              <Input
                                id="field-name"
                                value={newFieldName}
                                onChange={(e) =>
                                  setNewFieldName(e.target.value)
                                }
                                placeholder="e.g., Recipient Name"
                                autoFocus
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="field-type">Field Type</Label>
                            <Select
                              value={newFieldType}
                              onValueChange={(
                                v:
                                  | "text"
                                  | "email"
                                  | "number"
                                  | "date"
                                  | "id"
                                  | "qr"
                              ) => {
                                setNewFieldType(v);
                                // Auto-set name to "QR Code" when QR Code type is selected
                                if (v === "qr") {
                                  setNewFieldName("QR Code");
                                }
                              }}
                            >
                              <SelectTrigger id="field-type">
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
                                Field name will be automatically set to &quot;QR
                                Code&quot;
                              </p>
                            </div>
                          )}
                          {pendingField && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-400">
                                Position: ({Math.round(pendingField.x)},{" "}
                                {Math.round(pendingField.y)}) • Size:{" "}
                                {Math.round(pendingField.width)} ×{" "}
                                {Math.round(pendingField.height)}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground italic">
                            * Required fields: Email, Name (any type), Issue
                            Date (date type). Expiry Date (date type) is
                            optional. QR Code fields are auto-generated and
                            don&apos;t require input during credential issuance.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowNewField(false);
                                setPendingField(null);
                                setNewFieldName("");
                              }}
                            >
                              Cancel
                            </Button>
                            <PrimaryButton
                              onClick={() => {
                                // QR code fields don't require a name - auto-set to "QR Code"
                                const isQRCodeField = newFieldType === "qr";

                                if (!isQRCodeField && !newFieldName.trim()) {
                                  setModalMessage("Please enter a field name");
                                  setShowErrorModal(true);
                                  return;
                                }

                                // Check if QR code field already exists
                                if (isQRCodeField) {
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
                                  // QR codes must have coordinates (drawn on canvas)
                                  if (!pendingField) {
                                    setModalMessage(
                                      "Please draw the QR code field on the canvas"
                                    );
                                    setShowErrorModal(true);
                                    return;
                                  }
                                }

                                // For email fields, coordinates are always optional
                                // For Issue Date and Expiry Date, coordinates are optional (can be displayed or not)
                                const isEmailField = newFieldType === "email";
                                const isExpiryDateField =
                                  newFieldType === "date" &&
                                  newFieldName.toLowerCase().trim() ===
                                    "expiry date";
                                const isIssueDateField =
                                  newFieldType === "date" &&
                                  newFieldName.toLowerCase().trim() ===
                                    "issue date";

                                // Find Name field to copy styling from (mandatory field)
                                const nameField = fields.find(
                                  (f) => f.name.toLowerCase().trim() === "name"
                                );

                                // If user drew on canvas (pendingField exists), use coordinates (field will be displayed)
                                // If no pendingField, coordinates are undefined (field won't be displayed)
                                if (
                                  isEmailField ||
                                  isExpiryDateField ||
                                  isIssueDateField
                                ) {
                                  const field: TemplateField = {
                                    id: Date.now().toString(),
                                    name: newFieldName.trim(),
                                    type: newFieldType,
                                    // Use coordinates if user drew on canvas, otherwise undefined
                                    x: pendingField?.x,
                                    y: pendingField?.y,
                                    width: pendingField?.width || 0,
                                    height: pendingField?.height || 0,
                                    // Copy styling from Name field if it exists (for optional date fields), otherwise use selected styling
                                    fontFamily:
                                      (isIssueDateField || isExpiryDateField) &&
                                      nameField?.fontFamily
                                        ? nameField.fontFamily
                                        : selectedFontFamily,
                                    fontSize:
                                      (isIssueDateField || isExpiryDateField) &&
                                      nameField?.fontSize
                                        ? nameField.fontSize
                                        : selectedFontSize,
                                    fontColor:
                                      (isIssueDateField || isExpiryDateField) &&
                                      nameField?.fontColor
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
                                  setFields([...fields, field]);
                                  setSelectedField(field.id);
                                } else if (isQRCodeField && pendingField) {
                                  // QR code field - auto-set name to "QR Code" and require coordinates
                                  // Ensure square aspect ratio for QR codes
                                  const size = Math.max(
                                    pendingField.width,
                                    pendingField.height,
                                    50
                                  ); // Use larger dimension, minimum 50px
                                  // Center the QR code on the drawn area
                                  const centerX =
                                    pendingField.x + pendingField.width / 2;
                                  const centerY =
                                    pendingField.y + pendingField.height / 2;
                                  const qrX = centerX - size / 2;
                                  const qrY = centerY - size / 2;

                                  const qrCodeField: TemplateField = {
                                    id: Date.now().toString(),
                                    name: "QR Code", // Auto-set name
                                    type: "qr",
                                    x: Math.max(
                                      0,
                                      Math.min(
                                        qrX,
                                        (canvasRef.current?.width || 800) - size
                                      )
                                    ), // Ensure within canvas bounds
                                    y: Math.max(
                                      0,
                                      Math.min(
                                        qrY,
                                        (canvasRef.current?.height || 600) -
                                          size
                                      )
                                    ), // Ensure within canvas bounds
                                    width: size,
                                    height: size,
                                    // QR codes don't use font styling
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
                                } else {
                                  // For other fields, require coordinates from pendingField
                                  if (!pendingField) {
                                    setModalMessage(
                                      "Please draw a field on the canvas"
                                    );
                                    setShowErrorModal(true);
                                    return;
                                  }
                                  const isNameField =
                                    newFieldName.toLowerCase().trim() ===
                                    "name";
                                  const newField: TemplateField = {
                                    id: Date.now().toString(),
                                    name: newFieldName.trim(),
                                    type: newFieldType,
                                    x: pendingField.x,
                                    y: pendingField.y,
                                    width: pendingField.width,
                                    height: pendingField.height,
                                    fontFamily: selectedFontFamily,
                                    fontSize: selectedFontSize,
                                    fontColor: selectedFontColor,
                                    bold: false,
                                    italic: false,
                                  };
                                  const updatedFields = [...fields, newField];
                                  // If Name field was added, propagate its styling to existing optional fields
                                  if (isNameField) {
                                    const propagatedFields =
                                      propagateNameFieldStyling(
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
                              }}
                              disabled={
                                newFieldType !== "qr" && !newFieldName.trim()
                              }
                            >
                              Add Field
                            </PrimaryButton>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Canvas Area */}
                  <div className="lg:col-span-3 space-y-4">
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                          Template Canvas
                        </h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewMode(!previewMode);
                            setIsDragging(false);
                            setSelectedField(null);
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {previewMode ? "Edit" : "Preview"}
                        </Button>
                      </div>
                      {!previewMode && (
                        <p className="text-xs text-muted-foreground italic">
                          💡 Note: Click and drag on the canvas to draw fields.
                          Fields can be moved by clicking and dragging them.
                        </p>
                      )}

                      {/* Formatting Toolbar - Header Style */}
                      {selectedField &&
                        !previewMode &&
                        certificateImage &&
                        activeTab === "certificate" &&
                        templateType !== "badge" &&
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
                                    onValueChange={(value: string) => {
                                      if (selectedField) {
                                        const updatedFields = fields.map((f) =>
                                          f.id === selectedField
                                            ? { ...f, fontFamily: value }
                                            : f
                                        );
                                        const updatedField = updatedFields.find(
                                          (f) => f.id === selectedField
                                        );
                                        // If Name field was updated, propagate styling to optional fields
                                        if (
                                          updatedField &&
                                          updatedField.name
                                            .toLowerCase()
                                            .trim() === "name"
                                        ) {
                                          const propagatedFields =
                                            propagateNameFieldStyling(
                                              updatedFields,
                                              updatedField
                                            );
                                          setFields(propagatedFields);
                                        } else {
                                          setFields(updatedFields);
                                        }
                                      } else {
                                        setSelectedFontFamily(value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent border-border/50">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                      {googleFonts.map((font) => (
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
                                      min="1"
                                      max="72"
                                      value={
                                        fields.find(
                                          (f) => f.id === selectedField
                                        )?.fontSize || selectedFontSize
                                      }
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        // Allow empty input for user to type freely
                                        if (inputValue === "") {
                                          if (selectedField) {
                                            const updatedFields = fields.map(
                                              (f) =>
                                                f.id === selectedField
                                                  ? {
                                                      ...f,
                                                      fontSize: undefined,
                                                    }
                                                  : f
                                            );
                                            setFields(updatedFields);
                                          } else {
                                            setSelectedFontSize(16);
                                          }
                                          return;
                                        }

                                        let size = parseInt(inputValue);
                                        if (isNaN(size)) return;

                                        if (selectedField) {
                                          const field = fields.find(
                                            (f) => f.id === selectedField
                                          );
                                          if (
                                            field &&
                                            field.x !== undefined &&
                                            field.y !== undefined
                                          ) {
                                            // Calculate maximum allowed font size based on field dimensions
                                            const fontFamily =
                                              field.fontFamily ||
                                              selectedFontFamily;
                                            const isBold = field.bold || false;
                                            const isItalic =
                                              field.italic || false;
                                            const maxSize =
                                              calculateMaxFontSize(
                                                field,
                                                field.name,
                                                fontFamily,
                                                isBold,
                                                isItalic
                                              );

                                            // Only cap to maximum allowed - save exactly as user typed (no minimum enforcement)
                                            size = Math.min(size, maxSize);
                                          }

                                          // Save exactly as user typed (no automatic changes)
                                          const updatedFields = fields.map(
                                            (f) =>
                                              f.id === selectedField
                                                ? { ...f, fontSize: size }
                                                : f
                                          );
                                          const updatedField =
                                            updatedFields.find(
                                              (f) => f.id === selectedField
                                            );
                                          // If Name field was updated, propagate styling to optional fields
                                          if (
                                            updatedField &&
                                            updatedField.name
                                              .toLowerCase()
                                              .trim() === "name"
                                          ) {
                                            const propagatedFields =
                                              propagateNameFieldStyling(
                                                updatedFields,
                                                updatedField
                                              );
                                            setFields(propagatedFields);
                                          } else {
                                            setFields(updatedFields);
                                          }
                                        } else {
                                          setSelectedFontSize(size);
                                        }
                                      }}
                                      className="h-8 w-16 text-xs bg-background border-2 border-border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      px
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <ColorPickerComponent
                                    label="Color:"
                                    value={
                                      fields.find((f) => f.id === selectedField)
                                        ?.fontColor || selectedFontColor
                                    }
                                    onChange={(color) => {
                                      if (selectedField) {
                                        const updatedFields = fields.map((f) =>
                                          f.id === selectedField
                                            ? { ...f, fontColor: color }
                                            : f
                                        );
                                        const updatedField = updatedFields.find(
                                          (f) => f.id === selectedField
                                        );
                                        // If Name field was updated, propagate styling to optional fields
                                        if (
                                          updatedField &&
                                          updatedField.name
                                            .toLowerCase()
                                            .trim() === "name"
                                        ) {
                                          const propagatedFields =
                                            propagateNameFieldStyling(
                                              updatedFields,
                                              updatedField
                                            );
                                          setFields(propagatedFields);
                                        } else {
                                          setFields(updatedFields);
                                        }
                                      } else {
                                        setSelectedFontColor(color);
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            )}

                            {/* Show text formatting only for non-QR fields */}
                            {fields.find((f) => f.id === selectedField)
                              ?.type !== "qr" && (
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
                                      const updatedFields = fields.map((f) =>
                                        f.id === selectedField
                                          ? {
                                              ...f,
                                              bold: !(
                                                currentField?.bold || false
                                              ),
                                            }
                                          : f
                                      );
                                      const updatedField = updatedFields.find(
                                        (f) => f.id === selectedField
                                      );
                                      // If Name field was updated, propagate styling to optional fields
                                      if (
                                        updatedField &&
                                        updatedField.name
                                          .toLowerCase()
                                          .trim() === "name"
                                      ) {
                                        const propagatedFields =
                                          propagateNameFieldStyling(
                                            updatedFields,
                                            updatedField
                                          );
                                        setFields(propagatedFields);
                                      } else {
                                        setFields(updatedFields);
                                      }
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
                                      const updatedFields = fields.map((f) =>
                                        f.id === selectedField
                                          ? {
                                              ...f,
                                              italic: !(
                                                currentField?.italic || false
                                              ),
                                            }
                                          : f
                                      );
                                      const updatedField = updatedFields.find(
                                        (f) => f.id === selectedField
                                      );
                                      // If Name field was updated, propagate styling to optional fields
                                      if (
                                        updatedField &&
                                        updatedField.name
                                          .toLowerCase()
                                          .trim() === "name"
                                      ) {
                                        const propagatedFields =
                                          propagateNameFieldStyling(
                                            updatedFields,
                                            updatedField
                                          );
                                        setFields(propagatedFields);
                                      } else {
                                        setFields(updatedFields);
                                      }
                                    }
                                  }}
                                  title="Italic"
                                >
                                  <Italic className="h-4 w-4" />
                                </Button>
                              </div>
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
                          !previewMode &&
                          certificateImage &&
                          activeTab === "certificate" &&
                          templateType !== "badge"
                            ? "cursor-crosshair"
                            : "cursor-default"
                        } ${
                          !certificateImage && templateType !== "badge"
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <canvas
                          ref={canvasRef}
                          width={800}
                          height={600}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={() => {
                            if (isDragging || isMovingField) {
                              setIsDragging(false);
                              setIsMovingField(false);
                              setMovingFieldId(null);
                              setDragCurrent({ x: 0, y: 0 });
                            }
                          }}
                          className="w-full border-b border-border/50"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      </div>

                      {/* Tab Switcher - Only show if both certificate and badge are available, positioned below preview */}
                      {templateType === "both" &&
                        certificateImage &&
                        badgeImage && (
                          <div className="flex gap-3 justify-center border-t border-border/50 pt-4 mt-4">
                            <button
                              onClick={() => setActiveTab("certificate")}
                              className={`relative overflow-hidden rounded-lg transition-all ${
                                activeTab === "certificate"
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              title="Certificate"
                            >
                              <Image
                                src={certificateImage}
                                alt="Certificate preview"
                                width={64}
                                height={64}
                                className="object-cover rounded-lg aspect-square"
                                unoptimized
                              />
                              {activeTab === "certificate" && (
                                <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
                              )}
                            </button>
                            <button
                              onClick={() => setActiveTab("badge")}
                              className={`relative overflow-hidden rounded-lg transition-all ${
                                activeTab === "badge"
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              title="Badge"
                            >
                              <Image
                                src={badgeImage}
                                alt="Badge preview"
                                width={64}
                                height={64}
                                className="object-cover rounded-lg aspect-square"
                                unoptimized
                              />
                              {activeTab === "badge" && (
                                <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
                              )}
                            </button>
                          </div>
                        )}

                      {/* Real-time JSON Preview */}
                      <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            Field Data (JSON Format)
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                JSON.stringify(
                                  fields.map((f) => {
                                    const base: {
                                      name: string;
                                      type: string;
                                      coordinates?: {
                                        x: number;
                                        y: number;
                                        width: number;
                                        height: number;
                                      };
                                    } = { name: f.name, type: f.type };
                                    if (
                                      f.x !== undefined &&
                                      f.y !== undefined
                                    ) {
                                      base.coordinates = {
                                        x: f.x,
                                        y: f.y,
                                        width: f.width,
                                        height: f.height,
                                      };
                                    }
                                    return base;
                                  }),
                                  null,
                                  2
                                )
                              );
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <pre className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                          {JSON.stringify(
                            fields.map((f) => {
                              const base: {
                                name: string;
                                type: string;
                                coordinates?: {
                                  x: number;
                                  y: number;
                                  width: number;
                                  height: number;
                                };
                                fontFamily: string;
                                fontSize: number;
                                fontColor: string;
                              } = {
                                name: f.name,
                                type: f.type,
                                fontFamily: f.fontFamily || selectedFontFamily,
                                fontSize: f.fontSize || selectedFontSize,
                                fontColor: f.fontColor || selectedFontColor,
                              };

                              // Only include coordinates if field has them (not email fields without display)
                              if (f.x !== undefined && f.y !== undefined) {
                                base.coordinates = {
                                  x: Math.round(f.x),
                                  y: Math.round(f.y),
                                  width: Math.round(f.width),
                                  height: Math.round(f.height),
                                };
                              }

                              return base;
                            }),
                            null,
                            2
                          )}
                        </pre>
                      </Card>

                      {/* Field Controls */}
                      {selectedField &&
                        !previewMode &&
                        certificateImage &&
                        activeTab === "certificate" &&
                        templateType !== "badge" &&
                        fields.find((f) => f.id === selectedField)?.x !==
                          undefined &&
                        fields.find((f) => f.id === selectedField)?.y !==
                          undefined && (
                          <>
                            <Card className="p-4 bg-background/50 border border-primary/20 space-y-3">
                              <h3 className="font-semibold text-sm text-foreground">
                                Field Controls
                              </h3>
                              <div className="grid grid-cols-4 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateFieldPosition(selectedField, -10, 0)
                                  }
                                  className="gap-1"
                                >
                                  ← Move
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateFieldPosition(selectedField, 10, 0)
                                  }
                                  className="gap-1"
                                >
                                  Move →
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateFieldPosition(selectedField, 0, -10)
                                  }
                                  className="gap-1"
                                >
                                  ↑ Move
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateFieldPosition(selectedField, 0, 10)
                                  }
                                  className="gap-1"
                                >
                                  Move ↓
                                </Button>
                              </div>
                            </Card>
                          </>
                        )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          className="gap-2 bg-transparent"
                        >
                          <Download className="h-4 w-4" />
                          Export Template
                        </Button>
                        <PrimaryButton
                          onClick={handleSaveTemplate}
                          disabled={saving}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? "Saving..." : "Save Template"}
                        </PrimaryButton>
                      </div>
                    </Card>

                    {/* Help Section */}
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                      <h3 className="font-semibold text-foreground mb-3">
                        Help & Tips
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>
                          <strong className="text-foreground">
                            1. Draw Field:
                          </strong>{" "}
                          Click and drag on the canvas to draw a rectangle where
                          you want the field
                        </li>
                        <li>
                          <strong className="text-foreground">
                            2. Name Field:
                          </strong>{" "}
                          After drawing, a dialog will open to enter the field
                          name and type
                        </li>
                        <li>
                          <strong className="text-foreground">
                            3. Move Field:
                          </strong>{" "}
                          Click and drag an existing field to move it around the
                          canvas, or use the arrow buttons to fine-tune
                          placement
                        </li>
                        <li>
                          <strong className="text-foreground">
                            4. Email Required:
                          </strong>{" "}
                          At least one email field must be added for recipient
                          verification
                        </li>
                        <li>
                          <strong className="text-foreground">
                            5. View JSON:
                          </strong>{" "}
                          Check the JSON preview below the canvas to see field
                          coordinates and data
                        </li>
                        <li>
                          <strong className="text-foreground">
                            6. Save Template:
                          </strong>{" "}
                          Click save to store template and start issuing
                          credentials
                        </li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

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
