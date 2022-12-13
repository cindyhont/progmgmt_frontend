import { ReduxState } from '@reducers';
import { createEntityAdapter, createSlice, EntityId } from '@reduxjs/toolkit'

export interface GoogleFilePrelim {
    id:EntityId;
    parentType:'chat'|'task';
    mimeType:string;
    folder:'private'|'public';
    googleFileID:string;
    uploadEndpoint:string;
    parentID:EntityId;
    grandParentID:EntityId;
    dataUrl:string;
    fileName:string;
    fileSize:number;
    uploaded:number;
    uploading:boolean;
    error:boolean;
}

const
    googleFilePrelimAdapter = createEntityAdapter<GoogleFilePrelim>(),
    sliceName = 'googleFilePrelim',
    initialState = googleFilePrelimAdapter.getInitialState(),
    googleFilePrelimSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            addFiles:googleFilePrelimAdapter.addMany,
            upsertOneFile:googleFilePrelimAdapter.upsertOne,
        }
    }),
    googleFilePrelimSelector = googleFilePrelimAdapter.getSelectors((state:ReduxState)=>state.googleFilePrelim)

export const {
    addFiles,
    upsertOneFile,
} = googleFilePrelimSlice.actions
export { 
    sliceName, 
    initialState, 
    googleFilePrelimAdapter,
    googleFilePrelimSelector
}
export default googleFilePrelimSlice.reducer