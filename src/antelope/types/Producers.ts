export interface GetProducers {
  rows: Producer[];
}

export interface Producer {
  owner: string;
  is_active: number;
  total_votes: number;
  location: string;
  name: string;
}

export interface ProducerSchedule {
  active: {
    version: string;
    producers: {
      producer_name: string;
      authority: unknown;
    }[];
  };
  pending: null;
  proposed: null;
}

export interface ProducerScheduleData {
  active: { producers: { producer_name: string }[] };
}
