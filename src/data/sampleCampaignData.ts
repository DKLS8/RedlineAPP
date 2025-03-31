export const sampleCampaignData = {
  "campaigns": [
    {
      "campaign_name": "Tech Startups Q1",
      "campaign_id": "tech-q1",
      "status": "Converted",
      "progress": 100,
      "stats": {
        "sequence_started": 2000,
        "emails_sent": {
          "count": 2000,
          "total": 2000,
          "percentage": 100
        },
        "reply_rate": {
          "count": 360,
          "total": 2000,
          "percentage": 18
        },
        "positive_reply_rate": {
          "count": 120,
          "total": 360,
          "percentage": 33.33
        },
        "opportunities": {
          "count": 75,
          "value": 150000
        },
        "converted": {
          "count": 25,
          "total_sent": 2000,
          "percentage": 1.25
        }
      }
    },
    {
      "campaign_name": "Enterprise Sales Q1",
      "campaign_id": "ent-q1",
      "status": "Converted",
      "progress": 100,
      "stats": {
        "sequence_started": 1500,
        "emails_sent": {
          "count": 1500,
          "total": 1500,
          "percentage": 100
        },
        "reply_rate": {
          "count": 285,
          "total": 1500,
          "percentage": 19
        },
        "positive_reply_rate": {
          "count": 95,
          "total": 285,
          "percentage": 33.33
        },
        "opportunities": {
          "count": 45,
          "value": 225000
        },
        "converted": {
          "count": 15,
          "total_sent": 1500,
          "percentage": 1
        }
      }
    },
    {
      "campaign_name": "SMB Outreach Q1",
      "campaign_id": "smb-q1",
      "status": "Converted",
      "progress": 100,
      "stats": {
        "sequence_started": 3000,
        "emails_sent": {
          "count": 3000,
          "total": 3000,
          "percentage": 100
        },
        "reply_rate": {
          "count": 510,
          "total": 3000,
          "percentage": 17
        },
        "positive_reply_rate": {
          "count": 180,
          "total": 510,
          "percentage": 35.29
        },
        "opportunities": {
          "count": 90,
          "value": 90000
        },
        "converted": {
          "count": 30,
          "total_sent": 3000,
          "percentage": 1
        }
      }
    }
  ],
  "overall_performance": {
    "total_campaigns": 3,
    "total_stats": {
      "sequence_started": 6500,
      "emails_sent": {
        "count": 6500,
        "percentage": 100
      },
      "replies": {
        "count": 1155,
        "total": 6500,
        "percentage": 17.77
      },
      "positive_replies": {
        "count": 395,
        "total": 1155,
        "percentage": 34.20
      },
      "opportunities": {
        "count": 210,
        "value": 465000,
        "average_value": 2214.29
      },
      "converted": {
        "count": 70,
        "total": 6500,
        "percentage": 1.08,
        "value": 465000,
        "average_deal_size": 6642.86
      }
    },
    "averages": {
      "reply_rate": 18,
      "positive_reply_rate": 34.20,
      "conversion_rate": 1.08,
      "opportunity_rate": 3.23
    },
    "trends": {
      "best_performing_campaign": "SMB Outreach Q1",
      "highest_reply_rate": {
        "campaign": "Enterprise Sales Q1",
        "rate": 19
      },
      "highest_conversion": {
        "campaign": "Tech Startups Q1",
        "rate": 1.25
      },
      "highest_deal_value": {
        "campaign": "Enterprise Sales Q1",
        "value": 225000
      }
    }
  }
}; 