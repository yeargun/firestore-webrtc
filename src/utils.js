const remToPx = (rem) => {
  const htmlFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const px = rem * htmlFontSize;
  return px;
};

export { remToPx };
