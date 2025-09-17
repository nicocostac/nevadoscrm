import { expect, test } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

import {
  createTestUserFixtures,
  fetchLeadIdByName,
  generateMagicLink,
  supabaseAdmin,
} from "./utils";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function navigateWithMagicLink(page: import("@playwright/test").Page, email: string) {
  const actionLink = await generateMagicLink(email, `${baseURL}/auth/callback`);
  if (!actionLink) throw new Error("No se pudo generar el enlace mágico");
  await page.goto(actionLink);
  await page.waitForURL("**/dashboard");
}

test("flujo principal: login, crear lead, actividad, adjunto y mover oportunidad", async ({ page }) => {
  const fixtures = await createTestUserFixtures();
  await navigateWithMagicLink(page, fixtures.email);

  const timestamp = Date.now();
  const leadName = `Lead QA ${timestamp}`;
  let leadId: string | null = null;

  try {
    await page.goto("/leads");
    await page.getByRole("button", { name: "Nuevo lead" }).first().click();

    const sheet = page.locator("form");
    await sheet.getByLabel("Nombre").fill(leadName);
    await sheet.getByLabel("Empresa").fill(`Empresa QA ${timestamp}`);
    await sheet.getByLabel("Cargo").fill("CTO");
    await sheet.getByLabel("Correo").fill(`lead-${timestamp}@nevados.dev`);
    await sheet.getByLabel("Teléfono").fill("+56922222222");
    await sheet.getByLabel("Valor estimado ($)").fill("32000");
    await sheet.getByRole("button", { name: "Crear lead" }).click();

    await expect(page.getByText("Lead creado")).toBeVisible();
    await expect(page.getByText(leadName)).toBeVisible();

    leadId = await fetchLeadIdByName(leadName);
    expect(leadId).not.toBeNull();

    await page.goto(`/leads/${leadId}`);
    await expect(page.getByRole("heading", { name: leadName })).toBeVisible();

    await page.getByRole("button", { name: "Registrar actividad" }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel("Asunto").fill("Llamada inicial");
    await dialog.getByLabel("Notas").fill("Revisar requisitos y próximos pasos.");
    await dialog.getByRole("button", { name: "Registrar actividad" }).click();
    await expect(page.getByText("Actividad registrada")).toBeVisible();

    await page.getByRole("button", { name: "Completar" }).first().click();
    await expect(page.getByText("Actividad actualizada")).toBeVisible();

    const filePath = path.join(__dirname, "fixtures", "test-attachment.txt");
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.getByText("Adjunto cargado")).toBeVisible();
    await expect(page.getByText("test-attachment.txt")).toBeVisible();

    await page.goto("/opportunities");
    const card = page.getByText(fixtures.opportunity.name, { exact: true }).first();
    await card.waitFor({ state: "visible" });

    const sourceBox = await card.boundingBox();
    const targetColumn = page.locator('[data-stage="Negociación"]').first();
    const targetBox = await targetColumn.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error("No se pudo calcular la posición para el drag and drop");
    }

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, { steps: 10 });
    await page.mouse.up();

    await expect(page.getByText("Pipeline actualizado")).toBeVisible();
    await expect(targetColumn.getByText(fixtures.opportunity.name)).toBeVisible();
  } finally {
    if (leadId) {
      const { data: attachments } = await supabaseAdmin
        .from("attachments")
        .select("storage_path")
        .eq("lead_id", leadId);
      if (attachments && attachments.length > 0) {
        await supabaseAdmin.storage
          .from("crm-attachments")
          .remove(attachments.map((attachment) => attachment.storage_path));
        await supabaseAdmin.from("attachments").delete().eq("lead_id", leadId);
      }
      await supabaseAdmin.from("leads").delete().eq("id", leadId);
    }

    await supabaseAdmin.from("contacts").delete().eq("account_id", fixtures.account.id);
    await supabaseAdmin.from("opportunities").delete().eq("id", fixtures.opportunity.id);
    await supabaseAdmin.from("accounts").delete().eq("id", fixtures.account.id);
    await supabaseAdmin.auth.admin.deleteUser(fixtures.user.id);
  }
});
