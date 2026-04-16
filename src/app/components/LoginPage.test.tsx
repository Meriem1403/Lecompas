import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("affiche le formulaire de connexion", () => {
    render(<LoginPage onLogin={vi.fn().mockResolvedValue(true)} />);

    expect(screen.getByText("Connexion")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Adresse email"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mot de passe"),
    ).toBeInTheDocument();
  });

  it("affiche une erreur si les champs sont vides", async () => {
    const onLogin = vi.fn().mockResolvedValue(false);
    render(<LoginPage onLogin={onLogin} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Se connecter" }),
    );

    expect(
      await screen.findByText("Veuillez remplir tous les champs"),
    ).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });
});
