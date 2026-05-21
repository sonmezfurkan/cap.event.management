using AdminService as service from '../../srv/admin-service';

/* Events — List Report */
annotate service.Events with @(
  UI.SelectionFields: [
    status,
    startDate,
    venue_ID,
  ],
  UI.LineItem: [
    { Value: title },
    { Value: status, Criticality: statusCriticality },
    { Value: startDate },
    { Value: endDate },
    { Value: venue_ID },
    { Value: maxCapacity },
    { Value: attendeeCount },
    { Value: seatsRemaining },
  ],
);

/* Events — Labels, Text & Value Helps */
annotate service.Events with {
  title          @Common.Label: '{i18n>title}';
  status         @(
    Common.Label: '{i18n>status}',
    Common.ValueListWithFixedValues,
    Common.ValueList: {
      CollectionPath: 'EventStatuses',
      Parameters: [
        {
          $Type: 'Common.ValueListParameterInOut',
          LocalDataProperty: status,
          ValueListProperty: 'code',
        },
        {
          $Type: 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name',
        },
      ],
    },
  );
  description    @Common.Label: '{i18n>description}';
  startDate      @Common.Label: '{i18n>startDate}';
  endDate        @Common.Label: '{i18n>endDate}';
  maxCapacity    @Common.Label: '{i18n>maxCapacity}';
  attendeeCount  @Common.Label: '{i18n>attendeeCount}';
  seatsRemaining @Common.Label: '{i18n>seatsRemaining}';
  venue          @(
    Common.Label: '{i18n>venue}',
    Common.Text: venue.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList: {
      CollectionPath: 'Venues',
      Parameters: [
        {
          $Type: 'Common.ValueListParameterInOut',
          LocalDataProperty: venue_ID,
          ValueListProperty: 'ID',
        },
        {
          $Type: 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name',
        },
        {
          $Type: 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'city',
        },
      ],
    },
  );
};

/* Events — Object Page */
annotate service.Events with @(
  UI.HeaderInfo: {
    TypeName: '{i18n>eventTypeName}',
    TypeNamePlural: '{i18n>eventTypeNamePlural}',
    Title: { Value: title },
    Description: { Value: status },
    ImageUrl      : banner
  },
  UI.Identification: [
    {
      $Type        : 'UI.DataFieldForAction',
      Action       : 'AdminService.publish',
      Label        : '{i18n>publish}',
      ![@UI.Hidden]: {$edmJson: {$Not: {$Path: 'IsActiveEntity'}}}
    },
    {
      $Type        : 'UI.DataFieldForAction',
      Action       : 'AdminService.cancelEvent',
      Label        : '{i18n>cancelEvent}',
      ![@UI.Hidden]: {$edmJson: {$Not: {$Path: 'IsActiveEntity'}}}
    }
  ],
  UI.DataPoint #Capacity: {
    Value: attendeeCount,
    TargetValue: maxCapacity,
    Visualization: #Progress,
    Title: '{i18n>capacityIndicator}',
  },
  UI.DataPoint #Status   : {
    Value      : status,
    Criticality: statusCriticality,
    Title      : '{i18n>status}'
  },
  UI.FieldGroup #General: {
    Data: [
      { Value: title },
      { Value: description },
      { Value: status, Criticality: statusCriticality },
    ],
  },
  UI.FieldGroup #Dates: {
    Data: [
      { Value: startDate },
      { Value: endDate },
    ],
  },
  UI.FieldGroup #Capacity: {
    Data: [
      { Value: maxCapacity },
      { Value: attendeeCount },
      { Value: seatsRemaining },
    ],
  },
  UI.FieldGroup #Venue: {
    Data: [
      { Value: venue_ID },
    ],
  },
  UI.HeaderFacets: [
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'CapacityIndicator',
      Target: '@UI.DataPoint#Capacity',
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'Status',
      Target: '@UI.DataPoint#Status'
    }
  ],
  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID: 'EventDetails',
      Label: '{i18n>eventDetails}',
      Facets: [
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'General',
          Label: '{i18n>generalInformation}',
          Target: '@UI.FieldGroup#General',
        },
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'Dates',
          Label: '{i18n>dates}',
          Target: '@UI.FieldGroup#Dates',
        },
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'Capacity',
          Label: '{i18n>capacity}',
          Target: '@UI.FieldGroup#Capacity',
        },
        {
          $Type: 'UI.ReferenceFacet',
          ID: 'Venue',
          Label: '{i18n>venueSection}',
          Target: '@UI.FieldGroup#Venue',
        },
      ],
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'Sessions',
      Label: '{i18n>sessions}',
      Target: 'sessions/@UI.LineItem',
    },
    {
      $Type: 'UI.ReferenceFacet',
      ID: 'Registrations',
      Label: '{i18n>registrations}',
      Target: 'registrations/@UI.LineItem',
    },
  ],
);

annotate service.Events actions {
    publish     @(Common.SideEffects: {TargetProperties: [
        'status',
        'statusCriticality'
    ]});
    cancelEvent @(Common.SideEffects: {TargetProperties: [
        'status',
        'statusCriticality'
    ]})
};

/* Venues — Display Name Instead of ID */
annotate service.Venues with {
  ID @(
    Common.Text: name,
    Common.TextArrangement: #TextOnly,
  );
};

/* EventStatuses — Display Name Instead of Code */
annotate service.EventStatuses with {
  code @(
    Common.Text: name,
    Common.TextArrangement: #TextOnly,
  );
};


/* Registrations — Labels & List */
annotate service.Registrations with @(
    readonly,
    UI.LineItem: [
        {Value: firstName},
        {Value: lastName},
        {Value: email},
        {Value: status},
        {Value: confirmationCode},
    ]
);
annotate service.Registrations with {
  firstName        @Common.Label: '{i18n>firstName}';
  lastName         @Common.Label: '{i18n>lastName}';
  email            @Common.Label: '{i18n>email}';
  confirmationCode @Common.Label: '{i18n>confirmationCode}';
  status           @Common.Label: '{i18n>registrationStatus}';
};

/* Sessions — Labels & List */
annotate service.Sessions with @(
    UI.LineItem            : [
        {Value: title},
        {Value: startTime},
        {Value: endTime},
    ],
    UI.HeaderInfo          : {
        TypeName      : '{i18n>sessionTypeName}',
        TypeNamePlural: '{i18n>sessionTypeNamePlural}',
        Title         : {Value: title},
        Description   : {Value: description}
    },
    UI.FieldGroup #General : {Data: [
        {Value: title},
        {Value: description},
    ]},
    UI.FieldGroup #Schedule: {Data: [
        {Value: startTime},
        {Value: endTime},
        {Value: maxCapacity}
    ]},
    UI.Facets              : [
      {
        $Type : 'UI.CollectionFacet',
        ID    : 'SessionDetails',
        Label : '{i18n>sessionDetails}',
        Facets: [
          {
            $Type : 'UI.ReferenceFacet',
            ID    : 'General',
            Label : '{i18n>generalInformation}',
            Target: '@UI.FieldGroup#General'
          },
          {
            $Type : 'UI.ReferenceFacet',
            ID    : 'Schedule',
            Label : '{i18n>schedule}',
            Target: '@UI.FieldGroup#Schedule'
          }
        ]
      },
      {
        $Type : 'UI.ReferenceFacet',
        ID    : 'Speakers',
        Label : '{i18n>speakers}',
        Target: 'speakers/@UI.LineItem'
      }
    ]
);

annotate service.Sessions with {
    title       @Common.Label: '{i18n>sessionTitle}';
    description @Common.Label: '{i18n>sessionDescription}';
    startTime   @Common.Label: '{i18n>startTime}';
    endTime     @Common.Label: '{i18n>endTime}';
    maxCapacity @Common.Label: '{i18n>sessionMaxCapacity}';
};

annotate service.Sessions_Speakers with @(UI.LineItem: [
    {Value: speaker_ID},
    {Value: speaker.email}
]);

annotate service.Sessions_Speakers with {
  speaker @(
    Common.Label          : '{i18n>speaker}',
    Common.Text           : speaker.lastName,
    Common.TextArrangement: #TextOnly,
    Common.ValueList      : {
      CollectionPath: 'Speakers',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterOut',
          ValueListProperty: 'ID',
          LocalDataProperty: speaker_ID
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'firstName'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'lastName'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'email'
        }
      ]
    }
  )
};

annotate service.Speakers with @readonly {
    ID        @UI.Hidden;
    firstName @Common.Label: '{i18n>firstName}';
    lastName  @Common.Label: '{i18n>lastName}';
    email     @Common.Label: '{i18n>email}';
    bio       @Common.Label: '{i18n>bio}';
};