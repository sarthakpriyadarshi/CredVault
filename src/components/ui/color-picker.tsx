'use client';

import Color from 'color';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ColorPicker as BaseColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerOutput,
  ColorPickerFormat,
} from '@/components/ui/shadcn-io/color-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPickerComponent({ value, onChange, label, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState(0);
  const onChangeRef = useRef(onChange);

  // Keep the onChange ref up to date without triggering re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset the color picker when opening to reflect current value
      setKey(prev => prev + 1);
    }
  }, []);

  const handleColorChange = useCallback((rgba: Parameters<typeof Color.rgb>[0]) => {
    try {
      const color = Color.rgb(rgba);
      const hexValue = color.hex();
      onChangeRef.current(hexValue);
    } catch (error) {
      console.error('Error converting color:', error);
    }
  }, []);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            className="h-8 w-12 rounded border-2 border-border hover:border-primary/70 transition-colors cursor-pointer shadow-sm"
            style={{ backgroundColor: value || '#000000' }}
            type="button"
          />
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4 bg-card/95 backdrop-blur-sm border-border/50">
          <BaseColorPicker 
            key={key}
            defaultValue={value || '#000000'} 
            onChange={handleColorChange}
          >
            <div className="space-y-4">
              {/* Color Selection Area */}
              <ColorPickerSelection className="h-40 w-full" />

              {/* Hue Slider */}
              <ColorPickerHue />

              {/* Alpha Slider */}
              <ColorPickerAlpha />

              {/* Format Display and EyeDropper */}
              <div className="flex items-center gap-2">
                <ColorPickerFormat className="flex-1" />
                <ColorPickerOutput />
                <ColorPickerEyeDropper />
              </div>
            </div>
          </BaseColorPicker>
        </PopoverContent>
      </Popover>
    </div>
  );
}
