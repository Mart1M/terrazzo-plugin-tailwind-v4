import { formatCss } from "culori";

export default function pluginTailwindV4(options = {}) {
  const fileName = options.fileName || "theme.css";

  // Function to clean variable name parts
  function cleanVariableParts(parts) {
    // Special handling for border tokens
    if (parts[0] === "border") {
      // Remove 'default' from the path for border tokens
      return parts.filter((part) => part !== "default");
    }

    // For other tokens, only remove 'default' from the end
    if (parts[parts.length - 1] === "default") {
      return parts.slice(0, -1);
    }
    return parts;
  }

  // Function to format variable names based on scopes and path
  function formatVariableName(path, token) {
    const scopes =
      token.originalValue?.$extensions?.scopes ||
      token.$extensions?.scopes ||
      [];
    const pathParts = path.split(".");

    // Handle typography-font-family tokens with FONT_FAMILY scope
    if ((path.startsWith("typography-font-family") || path.startsWith("typography.font-family")) && scopes.includes("FONT_FAMILY")) {
      // Extract the font name (last part of the path)
      const fontName = pathParts[pathParts.length - 1];
      return `--font-${fontName}`;
    }

    // Handle CORNER_RADIUS scope
    if (scopes.includes("CORNER_RADIUS") || pathParts[0] === "border-radius") {
      // Get only the last part (the number)
      const numericPart = pathParts[pathParts.length - 1];
      return `--radius-${numericPart}`;
    }

    // Handle text-link tokens - special case to format as --color-link-* instead of --color-text-link-*
    if (path.includes("text-link") || (pathParts[0] === "text" && pathParts[1] === "link") || 
        (pathParts[0] === "color" && pathParts[1] === "text" && pathParts[2] === "link")) {
      let parts = [];
      
      // Handle different path formats
      if (pathParts[0] === "color" && pathParts[1] === "text" && pathParts[2] === "link") {
        // For color.text.link format, remove color and text
        parts = ["link", ...pathParts.slice(3)];
      } else if (pathParts[0] === "text" && pathParts[1] === "link") {
        // For text.link format, remove text
        parts = ["link", ...pathParts.slice(2)];
      } else if (path.includes("text-link")) {
        // For text-link format, split and reconstruct
        const joinedPath = pathParts.join("-");
        const segments = joinedPath.split("text-link");
        parts = ["link", ...segments[1].split("-").filter(part => part !== "")];
      }
      
      const cleanedParts = cleanVariableParts(parts);
      return `--color-${cleanedParts.join("-")}`;
    }

    // Handle text scope
    if (scopes.includes("TEXT_FILL")) {
      let parts = pathParts;
      // Remove 'color' prefix if it exists
      if (parts[0] === "color") {
        parts = parts.slice(1);
      }
      // Never remove the 'text' prefix
      const cleanedParts = cleanVariableParts(parts);
      return `--color-${cleanedParts.join("-")}`;
    }

    // Handle border tokens
    if (pathParts[0] === "border" || token.$type === "border") {
      const cleanedParts = cleanVariableParts(pathParts);
      // Remove 'color' from the end if it exists
      if (cleanedParts[cleanedParts.length - 1] === "color") {
        cleanedParts.pop();
      }
      return `--color-${cleanedParts.join("-")}`;
    }

    // Handle icon fills
    if (pathParts.includes("icon")) {
      let parts;
      // If path starts with 'color/icon'
      if (pathParts[0] === "color" && pathParts[1] === "icon") {
        parts = pathParts.slice(1); // Remove 'color' prefix
      }
      // If path starts with just 'icon'
      else if (pathParts[0] === "icon") {
        parts = pathParts;
      }
      // Any other case
      else {
        parts = pathParts;
      }
      const cleanedParts = cleanVariableParts(parts);
      return `--color-${cleanedParts.join("-")}`;
    }

    // Handle bg-surface and bg-fill specifically
    if (
      pathParts[0] === "color" &&
      // Handle bg-surface formats
      ((pathParts[1] === "bg" && pathParts[2] === "surface") ||
        pathParts[1] === "bg-surface" ||
        // Handle bg-fill formats
        (pathParts[1] === "bg" && pathParts[2] === "fill") ||
        pathParts[1] === "bg-fill")
    ) {
      let parts;

      // Handle dot notation (color.bg.surface or color.bg.fill)
      if (pathParts[1] === "bg") {
        parts = pathParts.slice(2); // Remove color and bg
      }
      // Handle hyphenated notation (color.bg-surface or color.bg-fill)
      else {
        parts = pathParts.slice(1).map((part) => {
          if (part === "bg-surface") return "surface";
          if (part === "bg-fill") return "fill";
          return part;
        });
      }

      const cleanedParts = cleanVariableParts(parts);
      return `--color-${cleanedParts.join("-")}`;
    }

    // Handle other bg fills (bg-*)
    if (
      pathParts[0] === "color" &&
      // Handle color.bg format
      (pathParts[1] === "bg" ||
        // Handle color.bg-* format (but not bg-surface)
        (pathParts[1].startsWith("bg-") && pathParts[1] !== "bg-surface"))
    ) {
      const parts =
        pathParts[1] === "bg" ? pathParts.slice(2) : pathParts.slice(1);
      const cleanedParts = cleanVariableParts(parts);
      return `--color-${cleanedParts.join("-")}`;
    }

    const cleanedParts = cleanVariableParts(pathParts);
    return `--${cleanedParts.join("-")}`;
  }

  function resolveTokenReference(value) {
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      const tokenPath = value.slice(1, -1);
      const pathParts = tokenPath.split(".");

      // If path starts with 'color/icon', remove 'color'
      if (pathParts[0] === "color" && pathParts[1] === "icon") {
        pathParts.shift(); // Remove 'color'
      }

      // Handle typography.font-family references
      if ((pathParts[0] === "typography" && pathParts[1] === "font-family") || 
          (pathParts[0] === "typography-font-family")) {
        const fontName = pathParts[0] === "typography-font-family" ? pathParts[1] : pathParts[2];
        return `var(--font-${fontName})`;
      }

      // Handle border-radius references
      if (
        pathParts[0] === "border-radius" ||
        (pathParts[0] === "border" && pathParts[1] === "radius")
      ) {
        // Remove 'border' and 'radius' parts
        pathParts.splice(0, pathParts[0] === "border-radius" ? 1 : 2);
        return `var(--radius-${pathParts.join("-")})`;
      }

      // Convert dots to dashes
      const variableName = `--${pathParts.join("-")}`;
      return `var(${variableName})`;
    }
    return value;
  }

  function formatValue(value) {
    console.log("formatValue input:", value);

    // Handle 0 value
    if (value === 0) {
      console.log("Handling 0 value");
      return "0";
    }

    // Check if value is a reference first
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      const resolved = resolveTokenReference(value);
      console.log("Resolved reference:", resolved);
      return resolved;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object" && value !== null) {
      // Handle new numeric format with value and unit
      if (value.value !== undefined && value.unit !== undefined) {
        return `${value.value}${value.unit}`;
      }

      // Handle border values
      if (
        value.$type === "border" ||
        (value.width && value.style && value.color)
      ) {
        const borderValue = value.$value || value;
        // Return only the color value
        return formatValue(borderValue.color);
      }

      // Handle dimension values
      if (value.$type === "dimension") {
        console.log("Handling dimension value:", value);
        if (value.$value && typeof value.$value === "object") {
          // Handle new format
          return `${value.$value.value}${value.$value.unit}`;
        }
        return formatValue(value.$value);
      }

      // Handle shadow values
      if (
        value.$type === "shadow" ||
        (value.offsetX && value.offsetY && value.blur !== undefined)
      ) {
        const shadowValue = value.$value || value;
        const formatShadowValue = (val) => {
          if (
            typeof val === "object" &&
            val.value !== undefined &&
            val.unit !== undefined
          ) {
            return `${val.value}${val.unit}`;
          }
          return resolveTokenReference(val) || "0";
        };

        const offsetX = formatShadowValue(shadowValue.offsetX);
        const offsetY = formatShadowValue(shadowValue.offsetY);
        const blur = formatShadowValue(shadowValue.blur);
        const spread = formatShadowValue(shadowValue.spread);
        const color =
          resolveTokenReference(shadowValue.color) || "rgb(0 0 0 / 0.05)";

        return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
      }

      // Handle color values
      if (value.colorSpace) {
        const formatted = formatCss(value);
        if (formatted) {
          return formatted;
        }
        // Fallback if formatCss returns undefined
        const { channels, alpha = 1 } = value;
        const [r, g, b] = channels.map((c) => Math.round(c * 255));
        return alpha === 1
          ? `rgb(${r}, ${g}, ${b})`
          : `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      if (value.$value) {
        return formatValue(value.$value);
      }
      if (value.value !== undefined) {
        return formatValue(value.value);
      }
    }

    // Handle direct number values
    if (typeof value === "number") {
      return String(value);
    }

    return String(value);
  }

  function getModeValue(modeToken) {
    console.log("getModeValue input:", modeToken);

    // Handle direct values (like 0, numbers, or strings)
    if (typeof modeToken === "number" || typeof modeToken === "string") {
      console.log("Returning direct value:", modeToken);
      return modeToken;
    }

    // Handle object values
    if (typeof modeToken === "object" && modeToken !== null) {
      console.log("Handling object value:", modeToken);

      // Handle value/unit format
      if (modeToken.value !== undefined && modeToken.unit !== undefined) {
        return {
          value: modeToken.value,
          unit: modeToken.unit,
        };
      }

      // Handle dimension values
      if (modeToken.$type === "dimension") {
        if (typeof modeToken.$value === "object" && modeToken.$value !== null) {
          return {
            value: modeToken.$value.value,
            unit: modeToken.$value.unit,
          };
        }
        return modeToken.$value;
      }

      // Handle source value if it exists
      if (modeToken.source?.node?.value !== undefined) {
        console.log(
          "Returning source node value:",
          modeToken.source.node.value
        );
        return modeToken.source.node.value;
      }

      // Handle standard object values
      if (modeToken.$value !== undefined) {
        console.log("Returning $value:", modeToken.$value);
        return modeToken.$value;
      }
      if (modeToken.value !== undefined) {
        console.log("Returning value:", modeToken.value);
        return modeToken.value;
      }
    }
    return modeToken;
  }

  return {
    name: "plugin-tailwind-v4",
    async transform({ tokens, setTransform }) {
      for (const [id, token] of Object.entries(tokens)) {
        // Set default transform
        const defaultValue = token.originalValue?.$value || token.$value;
        if (defaultValue) {
          setTransform(id, {
            format: "tailwind-v4",
            path: id,
            value: formatValue(defaultValue),
            mode: "default",
            token, // Pass the token for scope access
          });
        }

        // Handle modes from extensions
        if (token.originalValue?.extensions?.mode || token.$extensions?.mode) {
          const modes =
            token.originalValue?.extensions?.mode || token.$extensions.mode;
          for (const [modeName, modeValue] of Object.entries(modes)) {
            console.log(`Processing mode ${modeName} for token:`, {
              path: id,
              type: token.$type,
              modeValue,
            });

            // Check if it's a reference first
            const isReference =
              typeof modeValue === "string" &&
              modeValue.startsWith("{") &&
              modeValue.endsWith("}");

            // Handle dimension values in modes
            if (token.$type === "dimension") {
              console.log("Handling dimension value:", {
                isReference,
                modeValue,
              });

              const value = isReference
                ? resolveTokenReference(modeValue)
                : formatValue(modeValue);

              console.log("Formatted dimension value:", value);

              setTransform(id, {
                format: "tailwind-v4",
                path: id,
                value: value,
                mode: modeName,
                token,
              });
              continue;
            }

            // Handle shadow values in modes
            if (token.$type === "shadow" && !isReference) {
              const shadowValue = formatValue({
                $type: "shadow",
                $value: modeValue,
              });
              setTransform(id, {
                format: "tailwind-v4",
                path: id,
                value: shadowValue,
                mode: modeName,
                token,
              });
              continue;
            }

            const value = isReference
              ? resolveTokenReference(modeValue)
              : formatValue(modeValue);

            setTransform(id, {
              format: "tailwind-v4",
              path: id,
              value: value,
              mode: modeName,
              token,
            });
          }
        }

        // Handle modes from mode object
        if (token.mode) {
          for (const [modeName, modeToken] of Object.entries(token.mode)) {
            if (modeName !== ".") {
              // Check if source value is a reference
              const sourceValue = modeToken.source?.node?.value;
              if (
                sourceValue &&
                typeof sourceValue === "string" &&
                sourceValue.startsWith("{") &&
                sourceValue.endsWith("}")
              ) {
                setTransform(id, {
                  format: "tailwind-v4",
                  path: id,
                  value: resolveTokenReference(sourceValue),
                  mode: modeName,
                  token,
                });
                continue;
              }

              // Handle shadow values in mode object
              if (token.$type === "shadow") {
                const shadowValue = formatValue({
                  $type: "shadow",
                  $value: getModeValue(modeToken),
                });
                setTransform(id, {
                  format: "tailwind-v4",
                  path: id,
                  value: shadowValue,
                  mode: modeName,
                  token,
                });
                continue;
              }

              // Handle dimension values in mode object
              if (token.$type === "dimension") {
                const modeValue = getModeValue(modeToken);
                const value =
                  typeof modeValue === "number" || typeof modeValue === "string"
                    ? String(modeValue)
                    : formatValue(modeValue);

                setTransform(id, {
                  format: "tailwind-v4",
                  path: id,
                  value: value,
                  mode: modeName,
                  token,
                });
                continue;
              }

              const modeValue = getModeValue(modeToken);
              if (modeValue) {
                const value = formatValue(modeValue);
                setTransform(id, {
                  format: "tailwind-v4",
                  path: id,
                  value: value,
                  mode: modeName,
                  token,
                });
              }
            }
          }
        }
      }
    },
    async build({ getTransforms, outputFile }) {
      const modes = new Set();
      const defaultTheme = new Map();
      const modeThemes = new Map();

      // Collect all modes and organize tokens
      const transforms = getTransforms({ format: "tailwind-v4" });
      transforms.forEach((transform) => {
        const variableName = formatVariableName(
          transform.path,
          transform.token
        );

        if (transform.mode === "default") {
          defaultTheme.set(variableName, transform.value);
        } else {
          modes.add(transform.mode);
          if (!modeThemes.has(transform.mode)) {
            modeThemes.set(transform.mode, new Map());
          }
          modeThemes.get(transform.mode).set(variableName, transform.value);
        }
      });

      // Generate the CSS output
      const output = [ "@import url('https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&display=swap');",'@import "tailwindcss";', "", "@theme {"];

      // Add base resets
      const baseResets = [
        "color",
        "shadow",
        "text",
        "spacing",
        "border",
        "typography",
        "radius",
      ];
      baseResets.forEach((prefix) => {
        output.push(`  --${prefix}-*: initial;`);
      });
      output.push("");

      // Add default theme variables
      const sortedVariables = Array.from(defaultTheme.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      );
      sortedVariables.forEach(([name, value]) => {
        output.push(`  ${name}: ${value};`);
      });

      output.push("}");
      output.push("");

      // Add mode-specific theme variables
      if (modeThemes.size > 0) {
        modeThemes.forEach((variables, mode) => {
          output.push(`  [data-theme='${mode.toLowerCase()}'] {`);
          const sortedModeVariables = Array.from(variables.entries()).sort(
            (a, b) => a[0].localeCompare(b[0])
          );
          sortedModeVariables.forEach(([name, value]) => {
            output.push(`    ${name}: ${value};`);
          });
          output.push("  }");
          output.push("");
        });
      }

      outputFile(fileName, output.join("\n"));
    },
  };
}
