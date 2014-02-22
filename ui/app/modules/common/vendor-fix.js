moment.duration.fn.format = function() {
  str = "";
  if(this.days() > 0) str = str + Math.floor(this.days()) + "d ";
  if(this.hours() > 0) str = str + Math.floor(this.hours()) + "h ";
  if(this.minutes() > 0) str = str + Math.floor(this.minutes()) + "m ";
  if(this.seconds() > 0) str = str + Math.floor(this.seconds()) + "s ";
  return str;
}