module Webhooks
  # Receives GitHub App webhooks. Inherits ActionController::Base directly so it
  # is free of the app's auth gate, CSRF token check, and browser allowlist —
  # this is a signed server-to-server endpoint, verified by HMAC instead.
  class GithubController < ActionController::Base
    skip_forgery_protection

    def create
      body = request.body.read

      return head :unauthorized unless signature_ok?(body)

      # We only act on pull_request events; ack everything else so GitHub doesn't retry.
      return head :no_content unless request.headers["X-GitHub-Event"] == "pull_request"

      payload = JSON.parse(body)
      result = Github::PullRequestSync.new(payload).call
      render json: { status: result.status }, status: :ok
    rescue JSON::ParserError
      head :bad_request
    end

    private

    def signature_ok?(body)
      secret = ENV["GITHUB_WEBHOOK_SECRET"].presence
      if secret
        Github::WebhookSignature.valid?(
          body: body,
          signature: request.headers["X-Hub-Signature-256"],
          secret: secret,
        )
      else
        # No secret configured: allow locally for testing, never in production.
        Rails.logger.warn("[github webhook] GITHUB_WEBHOOK_SECRET unset — skipping verification")
        !Rails.env.production?
      end
    end
  end
end
