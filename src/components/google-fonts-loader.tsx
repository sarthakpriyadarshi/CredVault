"use client";

import { useEffect, useState } from "react";

/**
 * Component to load Google Fonts dynamically only when needed
 * This reduces the initial bundle size for pages that don't need these fonts
 */
export function GoogleFontsLoader() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Only load fonts once
    if (fontsLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Lato:wght@100;300;400;700;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Raleway:wght@100;200;300;400;500;600;700;800;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Oswald:wght@200;300;400;500;600;700&family=Lora:wght@400;500;600;700&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Ubuntu:wght@300;400;500;700&family=Nunito:wght@200;300;400;500;600;700;800;900&family=PT+Sans:wght@400;700&family=Noto+Sans:wght@400;500;600;700&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&family=Playfair+Display+SC:wght@400;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&family=EB+Garamond:wght@400;500;600;700;800&family=Alfa+Slab+One&family=Bebas+Neue&family=Righteous&family=Abril+Fatface&family=Anton&family=Archivo+Black&family=Bangers&family=Courgette&family=Croissant+One&family=Dancing+Script:wght@400;500;600;700&family=Fredoka+One&family=Great+Vibes&family=Lobster&family=Pacifico&family=Permanent+Marker&family=Quicksand:wght@300;400;500;600;700&family=Satisfy&family=Shadows+Into+Light&family=Yellowtail&display=swap";
    link.media = "print";
    link.onload = () => {
      link.media = "all";
      setFontsLoaded(true);
    };
    link.onerror = () => {
      setFontsLoaded(true); // Set to true even on error to prevent retries
    };
    document.head.appendChild(link);

    return () => {
      // Cleanup if component unmounts
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [fontsLoaded]);

  return null;
}
