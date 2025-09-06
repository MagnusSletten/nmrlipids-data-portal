// Contains data for constructing an info.yml file. 

export default interface infoData{
  DOI: string,
  TRJ: string,
  TPR: string,
  SOFTWARE: string,
  PREEQTIME: number,
  TIMELEFTOUT: number,
  UNITEDATOM_DICT?: object,
  TEMPERATURE?: number,
  SYSTEM?: string,
  PUBLICATION?: string,
  AUTHORS_CONTACT?: string,
  SOFTWARE_VERSION?: string|number,
  FF: string,
  FF_SOURCE: string,
  FF_DATE: string,
  CPT: string,
  LOG: string,
  TOP: string,
  GRO: string,
  EDR: string,
  LIPID_COMPOSITION: object,
  SOLUTION_COMPOSITION: object

}

export const defaultdata = () =>{
  const data:infoData = {
    DOI: "",
    TRJ: "",
    TPR: "",
    SOFTWARE: "",
    PREEQTIME: 0,
    TIMELEFTOUT: 0,
    UNITEDATOM_DICT: {},
    TEMPERATURE: 0,
    SYSTEM: "",
    PUBLICATION: "",
    AUTHORS_CONTACT: "",
    SOFTWARE_VERSION: "",
    FF: "",
    FF_SOURCE: "",
    FF_DATE: "",
    CPT: "",
    LOG: "",
    TOP: "",
    GRO: "",
    EDR: "",
    LIPID_COMPOSITION: {},
    SOLUTION_COMPOSITION: {}
  }
  return data
}



