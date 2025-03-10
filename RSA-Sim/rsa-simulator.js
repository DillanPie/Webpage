let n, e, d;

    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }

    function modInverse(a, m) {
      for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) return x;
      }
      return -1;
    }

    function modExp(base, exp, mod) {
      let result = 1;
      base = base % mod;
      while (exp > 0) {
        if (exp % 2 === 1) {
          result = (result * base) % mod;
        }
        exp = Math.floor(exp / 2);
        base = (base * base) % mod;
      }
      return result;
    }

    function generateKeys() {
      const p = parseInt(document.getElementById("primeP").value);
      const q = parseInt(document.getElementById("primeQ").value);
      e = parseInt(document.getElementById("intE").value);

      if (!p || !q || p <= 1 || q <= 1) {
        alert("Please enter valid prime numbers for p and q.");
        return;
      }

      n = p * q;
      const phi = (p - 1) * (q - 1);

      if (!(1 < e && e < phi && gcd(e, phi) === 1)) {
        alert(`e must satisfy: 1 < e < φ(n) and gcd(e, φ(n)) = 1. φ(n) = ${phi}`);
        return;
      }

      d = modInverse(e, phi);

      if (d === -1) {
        alert("Failed to compute modular inverse. Try different primes or e.");
        return;
      }

      document.getElementById("keys").textContent = 
        `Public Key: {e: ${e}, n: ${n}} | Private Key: {d: ${d}, n: ${n}}`;
    }

    function encryptMessage() {
      const message = parseInt(document.getElementById("message").value);
      if (!n || !e) {
        alert("Generate keys first!");
        return;
      }

      const ciphertext = modExp(message, e, n);
      document.getElementById("ciphertext").textContent = `Ciphertext: ${ciphertext}`;
    }

    function decryptMessage() {
      const cipher = parseInt(document.getElementById("cipher").value);
      if (!n || !d) {
        alert("Generate keys first!");
        return;
      }

      const decrypted = modExp(cipher, d, n);
      document.getElementById("decryptedMessage").textContent = `Decrypted Message: ${decrypted}`;
    }