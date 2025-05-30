
export const formatCancelDate = (dateString: string | number) => {
  let date;
  if (typeof dateString === 'number') {
    date = new Date(dateString * 1000);
  } else {
    date = new Date(dateString);
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getNextBillingDate = (subscription?: any) => {
  if (subscription?.current_period_end) {
    return formatCancelDate(subscription.current_period_end);
  }
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return formatCancelDate(nextMonth.toISOString());
};
