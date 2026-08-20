export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Return plain text if it does not contain HTML tags
  if (!html.includes('<') && !html.includes('>')) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const allowedTags = new Set([
    'p', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'blockquote', 'pre', 'code', 'br'
  ]);

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (!allowedTags.has(tagName)) {
        return document.createTextNode(el.textContent || '');
      }
      
      const cleanEl = document.createElement(tagName);
      
      // Sanitise attributes (only allow safe link endpoints)
      if (tagName === 'a') {
        const href = el.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('/'))) {
          cleanEl.setAttribute('href', href);
          cleanEl.setAttribute('target', '_blank');
          cleanEl.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      // Recursively clean children
      el.childNodes.forEach((child) => {
        const cleaned = cleanNode(child);
        if (cleaned) {
          cleanEl.appendChild(cleaned);
        }
      });
      
      return cleanEl;
    }
    
    return null;
  };

  const cleanBody = document.createElement('div');
  doc.body.childNodes.forEach((child) => {
    const cleaned = cleanNode(child);
    if (cleaned) {
      cleanBody.appendChild(cleaned);
    }
  });

  return cleanBody.innerHTML;
};
