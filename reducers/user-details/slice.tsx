import { createEntityAdapter, createSlice, EntityId, EntityState, Update } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { ReduxState } from '@reducers'
import { UserDetails } from './interfaces';

const 
    userDetailsAdapter = createEntityAdapter<UserDetails>(),
    sliceName = 'userDetails',
    initialState = userDetailsAdapter.getInitialState(),
    slice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            addUserDetailsStatusUnknown(state:EntityState<UserDetails>,{payload}:PayloadAction<{
                id:EntityId;
                firstName:string;
                lastName:string;
                avatar:string;
            }[]>){
                const 
                    currentIDs = state.ids,
                    newUsers = payload.filter(ud=>currentIDs.indexOf(ud.id)===-1),
                    existingUsers = payload.filter(ud=>currentIDs.indexOf(ud.id)!==-1)

                if (!!newUsers.length) userDetailsAdapter.addMany(state,newUsers.map(ud=>({...ud,online:false})))
                if (!!existingUsers.length) userDetailsAdapter.updateMany(
                    state,
                    existingUsers.map(ud=>({
                        id:ud.id,
                        changes:{
                            firstName:ud.firstName,
                            lastName:ud.lastName,
                            avatar:ud.avatar,
                        }
                    }))
                )
            },
            newOnlineUserList(state:EntityState<UserDetails>,{payload}:PayloadAction<EntityId[]>){
                const 
                    existingIDs = payload.filter(e=>state.ids.includes(e)),
                    newIDs = payload.filter(e=>!state.ids.includes(e))
                if (!!existingIDs.length) userDetailsAdapter.updateMany(state,existingIDs.map(id=>({id,changes:{online:true}})))
                if (!!newIDs.length) userDetailsAdapter.addMany(state,newIDs.map(id=>({id,online:true,firstName:'',lastName:'',avatar:''})))
            },
            userDetailsUpsertMany:userDetailsAdapter.upsertMany,
            userDetailsUpdateOne(state:EntityState<UserDetails>,{payload}:PayloadAction<Update<UserDetails>>){
                if (state.ids.includes(payload.id)) userDetailsAdapter.updateOne(state,payload)
            },
        }
    }),
    userDetailsSelector = userDetailsAdapter.getSelectors((state:ReduxState)=>state.userDetails)


export const {
    addUserDetailsStatusUnknown,
    userDetailsUpsertMany,
    newOnlineUserList,
    userDetailsUpdateOne,
} = slice.actions
export { 
    sliceName, 
    initialState,
    userDetailsSelector,
}
export default slice.reducer