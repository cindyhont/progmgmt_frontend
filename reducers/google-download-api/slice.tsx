import { ReduxState } from '@reducers';
import { createEntityAdapter, createSlice, EntityId } from '@reduxjs/toolkit'

export interface GoogleFile {
    id:EntityId;
    name:string;
    size:number;
    downloading:boolean;
    progress:number;
    error:boolean;
    url:string;
}

const
    googleFileAdapter = createEntityAdapter<GoogleFile>(),
    sliceName = 'googleFile',
    initialState = googleFileAdapter.getInitialState(),
    googleFileSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            gFilesUpsertMany:googleFileAdapter.upsertMany,
            gFilesUpsertOne:googleFileAdapter.upsertOne,
        }
    }),
    googleFileSelector = googleFileAdapter.getSelectors((state:ReduxState)=>state.googleFile)

export const {
    gFilesUpsertMany,
    gFilesUpsertOne,
} = googleFileSlice.actions
export { 
    sliceName, 
    initialState, 
    googleFileAdapter,
    googleFileSelector
}
export default googleFileSlice.reducer