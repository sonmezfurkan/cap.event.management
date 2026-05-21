namespace events;

using {
    cuid,
    managed,
    Country,
    sap.common.CodeList
} from '@sap/cds/common';
using { Attachments } from '@cap-js/attachments';

@changelog: [title]
@cds.search: {
    title,
    description
}
entity Events : cuid, managed {
    @mandatory title       : String(150);
    description            : String(5000);
    @changelog
    @mandatory startDate   : DateTime;
    @changelog
    @mandatory endDate     : DateTime;
    @changelog
    @mandatory maxCapacity : Integer;
    @changelog
    status                 : EventStatus default 'draft';
    venue                  : Association to Venues;
    sessions               : Composition of many Sessions
                                 on sessions.event = $self;
    registrations          : Composition of many Registrations
                                 on registrations.event = $self;
    virtual attendeeCount  : Integer;
    virtual seatsRemaining : Integer;

    @Core.MediaType: bannerType
    @Core.ContentDisposition.Filename: bannerName
    banner          : LargeBinary;
    bannerType      : String @Core.IsMediaType;
    bannerName      : String;
}

entity Venues : cuid, managed {
    name          : String(150);
    city          : String(100);
    country       : Country;
    streetAddress : String(200);
    postalCode    : String(20);
    capacity      : Integer;
    events        : Association to many Events
                        on events.venue = $self;
}

@cds.search: {
    title,
    description
}
entity Sessions : cuid, managed {
    @mandatory title : String(200);
    description      : String(2000);
    startTime        : DateTime;
    endTime          : DateTime;
    maxCapacity      : Integer;
    event            : Association to Events;
    speakers         : Composition of many Sessions_Speakers
                           on speakers.session = $self;
    attachments      : Composition of many Attachments;
}

@PersonalData.EntitySemantics: 'DataSubject'
@cds.search: {
    firstName,
    lastName,
    bio
}
entity Speakers : cuid, managed {
    @PersonalData.FieldSemantics: 'DataSubjectID'
    email           : String(200);
    @PersonalData.IsPotentiallyPersonal
    firstName       : String(100);
    @PersonalData.IsPotentiallyPersonal
    lastName        : String(100);
    @PersonalData.IsPotentiallySensitive
    bio             : String(2000);
    businessPartner : String(10);
    sessions        : Association to many Sessions_Speakers
                          on sessions.speaker = $self;

    @Core.MediaType: photoType
    @Core.ContentDisposition.Filename: photoName
    photo           : LargeBinary;
    photoType       : String @Core.IsMediaType;
    photoName       : String;
}

entity Sessions_Speakers : cuid {
    session : Association to Sessions;
    speaker : Association to Speakers;
}

@PersonalData.EntitySemantics: 'DataSubject'
entity Registrations : cuid, managed {
    @PersonalData.FieldSemantics: 'DataSubjectID'
    @mandatory email     : String(200);
    @PersonalData.IsPotentiallyPersonal
    @mandatory firstName : String(100);
    @PersonalData.IsPotentiallyPersonal
    @mandatory lastName  : String(100);
    confirmationCode     : String(20);
    status               : RegistrationStatus default 'confirmed';
    @mandatory event     : Association to Events;
}

entity EventStatuses : CodeList {
    key code : EventStatus
}

type EventStatus        : String enum {
    draft;
    published;
    cancelled;
    completed;
}

type RegistrationStatus : String enum {
    confirmed;
    cancelled;
    waitlisted;
}
