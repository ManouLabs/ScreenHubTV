// Generic Zod-based validator helper
// Usage: const { ok, errors, data } = validate(schema, payload)
export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { ok: true, data: result.data, errors: {} };
    }

    const errors = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
    }
    return { ok: false, errors };
}

// Validate a single field by dot-path or array path
// Example: validateField(schema, formData, 'contacts.0.contactMethods.0.value')
export function validateField(schema, data, fieldPath) {
    const key = Array.isArray(fieldPath) ? fieldPath.join('.') : String(fieldPath);
    const result = schema.safeParse(data);
    if (result.success) return { ok: true, errors: {} };

    const messages = result.error.issues.filter((i) => i.path.join('.') === key).map((i) => i.message);

    if (messages.length === 0) return { ok: true, errors: {} };
    return { ok: false, errors: { [key]: messages } };
}
