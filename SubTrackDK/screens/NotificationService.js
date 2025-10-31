content: {
  title: `Fornyelse snart: ${subscriptionName}`,
  body: `${subscriptionName} fornyes om 1 dag`,
},
trigger: { type: 'date', date: new Date(date.getTime() - 24 * 60 * 60 * 1000) }, // 1 dag før
}); 