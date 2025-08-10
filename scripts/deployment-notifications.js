#!/usr/bin/env node

/**
 * Deployment Notifications Script
 *
 * Handles notifications for build and deployment events including:
 * - Success notifications
 * - Error notifications
 * - Rollback notifications
 * - Health check alerts
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

class NotificationManager {
  constructor() {
    this.config = {
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || "#cms-notifications",
        username: "CMS Bot",
        iconEmoji: ":construction:",
      },
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS === "true",
        recipients: (process.env.EMAIL_RECIPIENTS || "")
          .split(",")
          .filter(Boolean),
      },
      discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      },
    };
  }

  /**
   * Send build success notification
   */
  async notifyBuildSuccess(buildInfo) {
    const message = {
      text: `✅ CMS Content Build Successful`,
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: "Repository",
              value: buildInfo.repository,
              short: true,
            },
            {
              title: "Branch",
              value: buildInfo.branch,
              short: true,
            },
            {
              title: "Commit",
              value: `<${buildInfo.commitUrl}|${buildInfo.commit.substring(
                0,
                7
              )}>`,
              short: true,
            },
            {
              title: "Build Time",
              value: buildInfo.buildTime || "N/A",
              short: true,
            },
          ],
          footer: "Decap CMS",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (buildInfo.collections) {
      const collectionsText = Object.entries(buildInfo.collections)
        .map(([name, count]) => `${name}: ${count} items`)
        .join("\n");

      message.attachments[0].fields.push({
        title: "Collections Updated",
        value: collectionsText,
        short: false,
      });
    }

    await this.sendSlackNotification(message);
    await this.sendDiscordNotification({
      content: `✅ CMS content build completed successfully for ${buildInfo.repository}`,
      embeds: [
        {
          title: "Build Details",
          color: 0x00ff00,
          fields: message.attachments[0].fields.map((field) => ({
            name: field.title,
            value: field.value,
            inline: field.short,
          })),
        },
      ],
    });
  }

  /**
   * Send build failure notification
   */
  async notifyBuildFailure(errorInfo) {
    const message = {
      text: `❌ CMS Content Build Failed`,
      attachments: [
        {
          color: "danger",
          fields: [
            {
              title: "Repository",
              value: errorInfo.repository,
              short: true,
            },
            {
              title: "Branch",
              value: errorInfo.branch,
              short: true,
            },
            {
              title: "Commit",
              value: `<${errorInfo.commitUrl}|${errorInfo.commit.substring(
                0,
                7
              )}>`,
              short: true,
            },
            {
              title: "Error",
              value: errorInfo.error || "Unknown error",
              short: false,
            },
            {
              title: "Action Required",
              value: `<${errorInfo.actionUrl}|View Workflow Run>`,
              short: false,
            },
          ],
          footer: "Decap CMS",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendSlackNotification(message);
    await this.sendDiscordNotification({
      content: `❌ CMS content build failed for ${errorInfo.repository}`,
      embeds: [
        {
          title: "Build Error",
          color: 0xff0000,
          fields: message.attachments[0].fields.map((field) => ({
            name: field.title,
            value: field.value,
            inline: field.short,
          })),
        },
      ],
    });
  }

  /**
   * Send deployment success notification
   */
  async notifyDeploymentSuccess(deployInfo) {
    const message = {
      text: `🚀 Website Deployed Successfully`,
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: "Repository",
              value: deployInfo.repository,
              short: true,
            },
            {
              title: "Environment",
              value: deployInfo.environment || "Production",
              short: true,
            },
            {
              title: "URL",
              value: `<${deployInfo.url}|View Website>`,
              short: false,
            },
            {
              title: "Deploy Time",
              value: deployInfo.deployTime || "N/A",
              short: true,
            },
          ],
          footer: "GitHub Pages",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendSlackNotification(message);
    await this.sendDiscordNotification({
      content: `🚀 Website deployed successfully: ${deployInfo.url}`,
      embeds: [
        {
          title: "Deployment Details",
          color: 0x00ff00,
          fields: message.attachments[0].fields.map((field) => ({
            name: field.title,
            value: field.value,
            inline: field.short,
          })),
        },
      ],
    });
  }

  /**
   * Send rollback notification
   */
  async notifyRollback(rollbackInfo) {
    const message = {
      text: `⚠️ Automatic Rollback Initiated`,
      attachments: [
        {
          color: "warning",
          fields: [
            {
              title: "Repository",
              value: rollbackInfo.repository,
              short: true,
            },
            {
              title: "Failed Commit",
              value: `<${
                rollbackInfo.failedCommitUrl
              }|${rollbackInfo.failedCommit.substring(0, 7)}>`,
              short: true,
            },
            {
              title: "Rolled Back To",
              value: `<${
                rollbackInfo.rollbackCommitUrl
              }|${rollbackInfo.rollbackCommit.substring(0, 7)}>`,
              short: true,
            },
            {
              title: "Reason",
              value: rollbackInfo.reason || "Build or deployment failure",
              short: false,
            },
            {
              title: "Action Required",
              value: "Manual review and fix required before next deployment",
              short: false,
            },
          ],
          footer: "Automatic Rollback System",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendSlackNotification(message);
    await this.sendDiscordNotification({
      content: `⚠️ Automatic rollback initiated for ${rollbackInfo.repository}`,
      embeds: [
        {
          title: "Rollback Details",
          color: 0xffaa00,
          fields: message.attachments[0].fields.map((field) => ({
            name: field.title,
            value: field.value,
            inline: field.short,
          })),
        },
      ],
    });
  }

  /**
   * Send health check alert
   */
  async notifyHealthCheck(healthInfo) {
    const isHealthy = healthInfo.status === "healthy";
    const color = isHealthy ? "good" : "warning";
    const emoji = isHealthy ? "✅" : "⚠️";

    const message = {
      text: `${emoji} CMS Health Check ${
        isHealthy ? "Passed" : "Issues Detected"
      }`,
      attachments: [
        {
          color: color,
          fields: [
            {
              title: "Repository",
              value: healthInfo.repository,
              short: true,
            },
            {
              title: "Check Time",
              value: new Date().toISOString(),
              short: true,
            },
            {
              title: "Build Performance",
              value: `${healthInfo.buildTime}s`,
              short: true,
            },
            {
              title: "Content Items",
              value: healthInfo.contentSummary || "N/A",
              short: true,
            },
          ],
          footer: "Health Monitor",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (healthInfo.issues && healthInfo.issues.length > 0) {
      message.attachments[0].fields.push({
        title: "Issues Detected",
        value: healthInfo.issues.join("\n"),
        short: false,
      });
    }

    // Only send notifications for health issues or daily summaries
    if (!isHealthy || healthInfo.isDailyReport) {
      await this.sendSlackNotification(message);
      await this.sendDiscordNotification({
        content: `${emoji} CMS health check completed`,
        embeds: [
          {
            title: "Health Check Results",
            color: isHealthy ? 0x00ff00 : 0xffaa00,
            fields: message.attachments[0].fields.map((field) => ({
              name: field.title,
              value: field.value,
              inline: field.short,
            })),
          },
        ],
      });
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(message) {
    if (!this.config.slack.webhookUrl) {
      console.log(
        "Slack webhook URL not configured, skipping Slack notification"
      );
      return;
    }

    const payload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username,
      icon_emoji: this.config.slack.iconEmoji,
      ...message,
    };

    try {
      await this.sendWebhook(this.config.slack.webhookUrl, payload);
      console.log("✅ Slack notification sent successfully");
    } catch (error) {
      console.error("❌ Failed to send Slack notification:", error.message);
    }
  }

  /**
   * Send Discord notification
   */
  async sendDiscordNotification(message) {
    if (!this.config.discord.webhookUrl) {
      console.log(
        "Discord webhook URL not configured, skipping Discord notification"
      );
      return;
    }

    try {
      await this.sendWebhook(this.config.discord.webhookUrl, message);
      console.log("✅ Discord notification sent successfully");
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error.message);
    }
  }

  /**
   * Send webhook request
   */
  async sendWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Parse GitHub Actions environment variables
   */
  static parseGitHubContext() {
    return {
      repository: process.env.GITHUB_REPOSITORY,
      branch: process.env.GITHUB_REF_NAME,
      commit: process.env.GITHUB_SHA,
      commitUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`,
      actionUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      actor: process.env.GITHUB_ACTOR,
      workflow: process.env.GITHUB_WORKFLOW,
      runId: process.env.GITHUB_RUN_ID,
      runNumber: process.env.GITHUB_RUN_NUMBER,
    };
  }
}

// CLI interface
if (require.main === module) {
  const notificationManager = new NotificationManager();
  const action = process.argv[2];
  const context = NotificationManager.parseGitHubContext();

  switch (action) {
    case "build-success":
      const buildInfo = {
        ...context,
        buildTime: process.env.BUILD_TIME,
        collections: process.env.COLLECTIONS_INFO
          ? JSON.parse(process.env.COLLECTIONS_INFO)
          : null,
      };
      notificationManager.notifyBuildSuccess(buildInfo);
      break;

    case "build-failure":
      const errorInfo = {
        ...context,
        error: process.env.BUILD_ERROR || "Build failed",
      };
      notificationManager.notifyBuildFailure(errorInfo);
      break;

    case "deploy-success":
      const deployInfo = {
        ...context,
        url: process.env.DEPLOY_URL,
        environment: process.env.DEPLOY_ENVIRONMENT,
        deployTime: process.env.DEPLOY_TIME,
      };
      notificationManager.notifyDeploymentSuccess(deployInfo);
      break;

    case "rollback":
      const rollbackInfo = {
        ...context,
        failedCommit: process.env.FAILED_COMMIT,
        failedCommitUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${process.env.FAILED_COMMIT}`,
        rollbackCommit: process.env.ROLLBACK_COMMIT,
        rollbackCommitUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${process.env.ROLLBACK_COMMIT}`,
        reason: process.env.ROLLBACK_REASON,
      };
      notificationManager.notifyRollback(rollbackInfo);
      break;

    case "health-check":
      const healthInfo = {
        ...context,
        status: process.env.HEALTH_STATUS || "healthy",
        buildTime: process.env.BUILD_TIME,
        contentSummary: process.env.CONTENT_SUMMARY,
        issues: process.env.HEALTH_ISSUES
          ? JSON.parse(process.env.HEALTH_ISSUES)
          : [],
        isDailyReport: process.env.IS_DAILY_REPORT === "true",
      };
      notificationManager.notifyHealthCheck(healthInfo);
      break;

    default:
      console.error("Usage: node deployment-notifications.js <action>");
      console.error(
        "Actions: build-success, build-failure, deploy-success, rollback, health-check"
      );
      process.exit(1);
  }
}

module.exports = NotificationManager;
