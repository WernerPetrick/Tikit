module Github
  # Verifies GitHub's X-Hub-Signature-256 header: HMAC-SHA256 of the raw request
  # body keyed with the webhook secret. Constant-time comparison to avoid timing
  # leaks.
  module WebhookSignature
    module_function

    def valid?(body:, signature:, secret:)
      return false if signature.blank? || secret.blank?

      expected = "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", secret, body)
      ActiveSupport::SecurityUtils.secure_compare(expected, signature)
    end
  end
end
