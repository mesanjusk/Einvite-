import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventDetailsForm } from "./event-details-form";
import type { InviteData } from "../types";
describe("event time and venue fields", () => {
 it("commits each event's time and venue independently and exposes its date", () => {
 const onText=vi.fn(),onDate=vi.fn();
 render(<EventDetailsForm invite={{venueName:"Main hall",venueAddress:"Road",googleMapsUrl:null,events:[{id:"sangeet",name:"Sangeet",date:new Date("2027-02-01T00:00:00Z"),time:"7 PM",venueName:"Garden",address:"Road",googleMapsUrl:null}]} as InviteData} onText={onText} onDate={onDate}/>);
 fireEvent.click(screen.getByText("Sangeet · Time & venue"));
 const time=screen.getByLabelText("Time"); fireEvent.change(time,{target:{value:"8 PM"}});fireEvent.blur(time);
 expect(onText).toHaveBeenCalledWith({kind:"event",eventId:"sangeet",field:"time"},"8 PM");
 const venue=screen.getByLabelText("Venue");fireEvent.change(venue,{target:{value:"Courtyard"}});fireEvent.blur(venue);
 expect(onText).toHaveBeenCalledWith({kind:"event",eventId:"sangeet",field:"venueName"},"Courtyard");
 fireEvent.change(screen.getByLabelText("Date"),{target:{value:"2027-02-02"}});expect(onDate).toHaveBeenCalledWith({kind:"event",eventId:"sangeet"},"2027-02-02");
 });
});
