const xss = require("xss");

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }

  return value;
};

const removeInjectionChars = (value) => {
  if (typeof value === "string") {
    return value.replace(/\$/g, "");
  }

  if (Array.isArray(value)) {
    return value.map(removeInjectionChars);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      const sanitizedKey = key.replace(/[\$\.]/g, "");
      acc[sanitizedKey] = removeInjectionChars(item);
      return acc;
    }, {});
  }

  return value;
};

module.exports = (req, res, next) => {
  req.body = removeInjectionChars(sanitizeValue(req.body));
  req.query = removeInjectionChars(sanitizeValue(req.query));
  req.params = removeInjectionChars(sanitizeValue(req.params));
  next();
};
