export type ClientFilter = "all" | "residential" | "commercial" | "incomplete" | "overdue";
export type ClientSort = "name" | "last_contacted";

export type ClientListQuery = {
  search?: string;
  filter?: ClientFilter;
  sort?: ClientSort;
  clientTypeId?: string;
  tagId?: string;
};

export type LookupOption = {
  id: string;
  name: string;
  color: string | null;
};

export type ReferralFunnelOption = {
  id: string;
  name: string;
  requiresSource: boolean;
};

export type ReferralSourceOption = {
  id: string;
  name: string;
  referralFunnelId: string;
};

export type PaymentTermOption = {
  id: string;
  name: string;
  daysUntilDue: number;
};

export type SalesEmployeeOption = {
  id: string;
  fullName: string;
};

export type ClientLookups = {
  clientTypes: LookupOption[];
  tags: LookupOption[];
  referralFunnels: ReferralFunnelOption[];
  referralSources: ReferralSourceOption[];
  paymentTerms: PaymentTermOption[];
  salesLeads: SalesEmployeeOption[];
};

export type ClientListItem = {
  id: string;
  displayName: string;
  isCompany: boolean;
  email: string | null;
  phone: string | null;
  isIncomplete: boolean;
  clientTypeName: string | null;
  clientTypeColor: string | null;
  tagNames: string[];
  lastContacted: string | null;
  nextContact: string | null;
};

export type ClientAddressInput = {
  type: "billing" | "job_site" | "both";
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  isPrimary: boolean;
  notes?: string;
};

export type ClientContactInput = {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: string;
  isPrimary: boolean;
  notes?: string;
};

export type SaveClientInput = {
  id?: string;
  isCompany: boolean;
  companyName?: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  email?: string;
  clientTypeId?: string;
  salesLead?: string;
  referralFunnelId?: string;
  referralSourceId?: string;
  paymentTermsId?: string;
  contactFrequency?: "monthly" | "quarterly" | "bi-annually" | "annually" | "custom";
  contactFrequencyDays?: number;
  isPreviousCustomer: boolean;
  hasPortalAccess: boolean;
  notes?: string;
  addresses: ClientAddressInput[];
  contacts: ClientContactInput[];
  tagIds: string[];
};

export type ClientAddressRecord = ClientAddressInput & {
  id: string;
};

export type ClientContactRecord = ClientContactInput & {
  id: string;
};

export type NoteAttachmentRecord = {
  id: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
};

export type NoteRecord = {
  id: string;
  body: string;
  createdAt: string | null;
  authorName: string;
  attachments: NoteAttachmentRecord[];
};

export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  assigneeName: string;
  dueDate: string | null;
  priority: string;
  status: string;
};

export type CommunicationAttachmentRecord = {
  id: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
};

export type CommunicationRecord = {
  id: string;
  method: string;
  direction: string;
  result: string | null;
  notes: string | null;
  occurredAt: string;
  loggedByName: string;
  attachments: CommunicationAttachmentRecord[];
};

export type ClientDetailRecord = {
  id: string;
  isCompany: boolean;
  companyName: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  isIncomplete: boolean;
  isPreviousCustomer: boolean;
  hasPortalAccess: boolean;
  notes: string | null;
  clientTypeId: string | null;
  clientTypeName: string | null;
  clientTypeColor: string | null;
  salesLeadId: string | null;
  salesLeadName: string | null;
  referralFunnelId: string | null;
  referralFunnelName: string | null;
  referralSourceId: string | null;
  referralSourceName: string | null;
  paymentTermsId: string | null;
  paymentTermsName: string | null;
  contactFrequency: string | null;
  contactFrequencyDays: number | null;
  lastContacted: string | null;
  nextContact: string | null;
  addresses: ClientAddressRecord[];
  contacts: ClientContactRecord[];
  tags: LookupOption[];
  notesFeed: NoteRecord[];
  tasksFeed: TaskRecord[];
  communications: CommunicationRecord[];
};

export type CreateCommunicationInput = {
  clientId: string;
  method: "phone" | "email" | "text" | "in_person" | "portal_message";
  direction: "inbound" | "outbound";
  result?: "spoke_with_client" | "left_voicemail" | "no_answer" | "email_sent" | "meeting_held" | "other";
  notes?: string;
  occurredAt: string;
  attachment?: File;
};
