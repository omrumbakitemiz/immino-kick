#!/bin/bash

# Array of fake users
users=("alice_gamer" "bob_streamer" "charlie_viewer" "diana_fan" "eve_watcher" "frank_chatter" "grace_lurker" "henry_mod" "iris_subscriber" "jack_follower")

# Vote options (only A and B)
votes=("A" "B")

echo "🎭 Simulating 10 fake votes with options A and B..."

for i in {1..10}; do
  # Pick random user and vote
  user=${users[$((RANDOM % ${#users[@]}))]}
  vote=${votes[$((RANDOM % ${#votes[@]}))]}
  user_id=$((RANDOM % 90000 + 10000))

  echo "📨 Vote #$i: Sending vote '$vote' from $user (ID: $user_id)"

  curl -s -X POST http://localhost:3000/api/webhook \
    -H "Content-Type: application/json" \
    -H "Kick-Event-Type: chat.message.sent" \
    -H "Kick-Event-Message-Id: msg_${RANDOM}" \
    -H "Kick-Event-Subscription-Id: sub_12345" \
    -H "Kick-Event-Message-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" \
    -H "Kick-Event-Signature: fake_signature_for_testing" \
    -d "{
      \"content\": \"$vote\",
      \"sender\": {
        \"user_id\": $user_id,
        \"username\": \"$user\"
      },
      \"broadcaster\": {
        \"username\": \"your_channel\"
      },
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }" > /dev/null

  if [ $? -eq 0 ]; then
    echo "✅ Vote '$vote' from $user sent successfully"
  else
    echo "❌ Failed to send vote from $user"
  fi

  sleep 0.3
done

echo ""
echo "🎉 Done! Sent 10 random votes (A or B) from different users."
echo "💡 Check your webhook logs or GET /api/webhook to see the vote counts."
