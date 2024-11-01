using {cuid } from '@sap/cds/common';

namespace my.jobapplication;

entity Drafts : cuid {
    jobApplicationId: Integer64 not null;
    optionId: Integer64 not null;
    customIntegridadeComments: LargeString not null;
}