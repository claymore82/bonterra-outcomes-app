// Custom markdownlint rule: Selected option must have ✅ checkmark and bold
// Per spec: "Mark the selected option with ✅ and bold" - exactly one option should be marked

module.exports = {
  names: ["itd-single-selected-option"],
  description: "ITD OPTIONS section should have exactly one selected option (✅ and bold)",
  tags: ["itd", "options"],
  function: function rule(params, onError) {
    // Only apply to ITD files
    if (!params.name.match(/ITD-\d+/i) && !params.name.includes("ITD-")) {
      return;
    }

    const lines = params.lines;
    let inOptionsSection = false;
    let optionsSectionStart = 0;
    let selectedOptions = [];  // Options with both ✅ and bold
    let boldOnlyOptions = [];  // Options with bold but no ✅
    let checkmarkOnlyOptions = [];  // Options with ✅ but no bold
    let totalOptions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Detect OPTIONS section start (## OPTIONS or ## OPTIONS CONSIDERED)
      if (/^##\s+OPTIONS/i.test(line)) {
        inOptionsSection = true;
        optionsSectionStart = lineNumber;
        continue;
      }

      // Detect next section (any ## heading ends OPTIONS section)
      if (inOptionsSection && /^##\s+/.test(line) && !/^##\s+OPTIONS/i.test(line)) {
        inOptionsSection = false;
        continue;
      }

      // Within OPTIONS section, look for numbered list items
      if (inOptionsSection) {
        // Match numbered list items: "1. " or "2. " etc.
        const optionMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (optionMatch) {
          const optionNumber = optionMatch[1];
          const optionContent = optionMatch[2];

          totalOptions.push({
            number: optionNumber,
            line: lineNumber,
            content: optionContent
          });

          // Check for ✅ checkmark
          const hasCheckmark = optionContent.includes('✅');
          
          // Check if option name is bolded
          // Pattern: "✅ **Option Name**" or "**Option Name**"
          const hasBold = /\*\*[^*]+\*\*/.test(optionContent);

          if (hasCheckmark && hasBold) {
            selectedOptions.push({
              number: optionNumber,
              line: lineNumber,
              content: optionContent
            });
          } else if (hasBold && !hasCheckmark) {
            boldOnlyOptions.push({
              number: optionNumber,
              line: lineNumber,
              content: optionContent
            });
          } else if (hasCheckmark && !hasBold) {
            checkmarkOnlyOptions.push({
              number: optionNumber,
              line: lineNumber,
              content: optionContent
            });
          }
        }
      }
    }

    // Report errors
    if (totalOptions.length > 0) {
      // Check for bold-only options (missing checkmark)
      if (boldOnlyOptions.length > 0 && selectedOptions.length === 0) {
        onError({
          lineNumber: boldOnlyOptions[0].line,
          detail: "Selected option is missing ✅ checkmark. Use format: `1. ✅ **Option Name**: description`",
          context: `Option ${boldOnlyOptions[0].number} has bold but no ✅`
        });
      }
      
      // Check for checkmark-only options (missing bold)
      if (checkmarkOnlyOptions.length > 0) {
        onError({
          lineNumber: checkmarkOnlyOptions[0].line,
          detail: "Selected option must also be bold. Use format: `1. ✅ **Option Name**: description`",
          context: `Option ${checkmarkOnlyOptions[0].number} has ✅ but no bold`
        });
      }

      // Check for no selected options at all
      if (selectedOptions.length === 0 && boldOnlyOptions.length === 0 && checkmarkOnlyOptions.length === 0) {
        onError({
          lineNumber: optionsSectionStart,
          detail: "No option is selected. Mark the selected option with ✅ and **bold**.",
          context: `Found ${totalOptions.length} options, none selected`
        });
      }
      
      // Check for multiple selected options
      if (selectedOptions.length > 1) {
        const selectedNumbers = selectedOptions.map(o => o.number).join(", ");
        onError({
          lineNumber: selectedOptions[1].line,
          detail: `Multiple options are selected (${selectedNumbers}). Only one option should have ✅ and bold.`,
          context: `Options ${selectedNumbers} are all marked as selected`
        });
      }
    }
  }
};

