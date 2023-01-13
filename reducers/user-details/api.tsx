import apiSlice, { fetchConfig } from "@reducers/api";
import { isSignedOut, sessionRenewTime } from "@reducers/misc";
import { addUserDetailsStatusUnknown, newOnlineUserList, otherServerDisconnect, userDetailsUpdateOne } from "@reducers/user-details/slice";
import { EntityId } from "@reduxjs/toolkit";
import { IoptionRawUser } from "./interfaces";

const
    PATH = '/pm-api',
    userDetailsApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            searchUser:build.mutation<string[],{
                query:string;
                exclude:EntityId[];
            }>({
                async queryFn(arg,{dispatch},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/search-user`,'POST',arg))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:[]}
                        } 
                        const data = result.data as IoptionRawUser[]
                        dispatch(addUserDetailsStatusUnknown(data))
                        dispatch(sessionRenewTime(start))
                        return {data:data.map(({id})=>id)}
                    } catch {}
                    return {data:[]}
                }
            }),
            newOnlineUserList:build.mutation<any,{ids:EntityId[]}>({
                queryFn({ids},{dispatch}){
                    dispatch(newOnlineUserList(ids))
                    return {data:null}
                }
            }),
            otherServerDisconnect:build.mutation<any,{ids:EntityId[]}>({
                queryFn({ids},{dispatch}){
                    dispatch(otherServerDisconnect(ids))
                    return {data:null}
                }
            }),
            newUserStatus:build.mutation<any,{id:EntityId;online:boolean;}>({
                queryFn({id,online},{dispatch}){
                    dispatch(userDetailsUpdateOne({id,changes:{online}}))
                    return {data:null}
                }
            }),
            fetchUsers:build.mutation<any,EntityId[]>({
                async queryFn(uids,{dispatch},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/fetch-users`,'POST',{uids}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:[]}
                        } 
                        const data = result.data as IoptionRawUser[]
                        dispatch(addUserDetailsStatusUnknown(data))
                        dispatch(sessionRenewTime(start))
                        return {data:data.map(({id})=>id)}
                    } catch {}
                    return {data:[]}
                }
            })
        })
    })

export const {
    useSearchUserMutation,
} = userDetailsApi
export default userDetailsApi