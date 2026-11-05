// Account previews run entirely in the browser. Only username and password
// are required to submit the registration preview.
export function optionalRecoveryEmail() {
  return `
    <label for="recovery-email">Recovery email (optional)</label>
    <input id="recovery-email" name="recoveryEmail" class="full"
           type="email" autocomplete="email" placeholder="you@example.com">
    <p class="muted">For password recovery only. You can register and sign in with just a username and password.</p>
  `;
}

export function accountForm(type) {
  const signup = type === 'signup';
  const recovery = type === 'recovery';
  const title = recovery ? 'Password recovery' : signup ? 'Create account' : 'Sign in';
  const action = recovery ? 'Preview recovery' : signup ? 'Preview registration' : 'Preview sign in';

  const fields = recovery ? `
    <label for="reset-email">Recovery email on your account</label>
    <input id="reset-email" class="full" type="email" autocomplete="email" required>
    <p class="muted">Email recovery requires a recovery address on your account.</p>
  ` : `
    <label for="account-username">Username</label>
    <input id="account-username" class="full" required autocomplete="off">
    <label for="account-password">Password</label>
    <input id="account-password" class="full" type="password" required
           minlength="8" autocomplete="new-password" placeholder="Preview password (8+ characters)">
    ${signup ? optionalRecoveryEmail() : ''}
  `;

  return `
    <h2>${title}</h2>
    <form id="auth-form">
      <div class="notice">Account preview. Use a sample password.</div>
      ${fields}
      <button class="primary full space" type="submit">${action}</button>
    </form>
  `;
}
