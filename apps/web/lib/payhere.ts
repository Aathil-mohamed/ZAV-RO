export function buildPayHereForm(action: string, fields: Record<string, string>): HTMLFormElement {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  return form;
}

export function submitPayHereForm(action: string, fields: Record<string, string>): void {
  const form = buildPayHereForm(action, fields);
  document.body.appendChild(form);
  form.submit();
}
