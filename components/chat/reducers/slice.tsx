import { createEntityAdapter, createSlice, EntityId, EntityState, Update } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Convo, Ichat, Room, RoomUser, User } from '../interfaces'
import { ReduxState } from '@reducers'
import { fileInputAdapter } from '@components/functions'
import { FileDraft } from '@components/interfaces'

const 
    roomAdapter = createEntityAdapter<Room>(),
    userAdapter = createEntityAdapter<User>(),
    convoAdapter = createEntityAdapter<Convo>(),
    
    roomUserAdapter = createEntityAdapter<RoomUser>(),
    sliceName = 'chat',
    initialState:Ichat = {
        contextMenuID:'',
        rooms:roomAdapter.getInitialState(),
        // userDetails:userDetailsAdapter.getInitialState(),
        users:userAdapter.getInitialState(),
    },
    chatSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            updateContextMenuID(state:Ichat,{payload}:PayloadAction<EntityId>){
                state.contextMenuID = payload
            },

            // rooms
            chatRoomUpsertMany(state:Ichat,{payload}:PayloadAction<Room[]>){
                roomAdapter.upsertMany(state.rooms,payload)
            },
            updateChatRoomStatus(state:Ichat,{payload}:PayloadAction<Update<Room>>){
                roomAdapter.updateOne(state.rooms,payload)
            },
            updateChatManyRoomStatus(state:Ichat,{payload}:PayloadAction<Update<Room>[]>){
                roomAdapter.updateMany(state.rooms,payload)
            },
            chatRoomAddOne(state:Ichat,{payload}:PayloadAction<{
                id:EntityId;
                users:EntityId[];
                name:string;
                avatar:string;
                isGroup:boolean;
            }>){
                roomAdapter.addOne(state.rooms,{
                    ...payload,
                    users:{
                        ids:payload.users,
                        entities:payload.users
                            .map(e=>({[e]:{
                                id:e,
                                lastSeen:0,
                                typing:false
                            }}))
                            .reduce((a,b)=> !a ? b : {...a,...b})
                    },
                    convos:convoAdapter.getInitialState(),
                    fileInputs:fileInputAdapter.getInitialState(),
                    markAsRead:0,
                    pinned:false,
                    draft:'',
                    replyMsgID:'',
                    reply:false,
                    editMsgID:'',
                    edit:false,
                    scrollY:0,
                    hasMoreConvos:false,
                    fetchingConvos:false,
                    viewportLatestConvoID:'',
                })
                // roomUserAdapter.setAll(state.rooms.entities[payload.id].users,payload.users.map(id=>({id,lastSeen:0,typing:false})))
            },

            // room users
            updateChatRoomUserStatus(state:Ichat,{payload}:PayloadAction<{
                roomID:EntityId;
                entityChange:Update<RoomUser>;
            }>){
                roomUserAdapter.updateOne(state.rooms.entities[payload.roomID].users,payload.entityChange)
            },

            // file inputs - both room and temp users
            chatRoomFileInputSetAll(state:Ichat,{payload}:PayloadAction<{files:FileDraft[];roomID:EntityId;}>){
                fileInputAdapter.setAll(state.rooms.entities[payload.roomID].fileInputs,payload.files)
                
            },
            chatUserFileInputSetAll(state:Ichat,{payload}:PayloadAction<{files:FileDraft[];userID:EntityId;}>){
                fileInputAdapter.setAll(state.rooms.entities[payload.userID].fileInputs,payload.files)
            },
            
            // room convos
            chatRoomConvoUpdate(state:Ichat,{payload}:PayloadAction<{
                roomID:EntityId;
                entityChange:Update<Convo>;
            }>){
                convoAdapter.updateOne(state.rooms.entities[payload.roomID].convos,payload.entityChange)
            },
            chatRoomConvoAddOne(state:Ichat,{payload}:PayloadAction<{
                roomID:EntityId;
                convo:Convo;
            }>){
                convoAdapter.addOne(state.rooms.entities[payload.roomID].convos,payload.convo)
            },
            chatRoomConvoUpsertMany(state:Ichat,{payload}:PayloadAction<{
                roomID:EntityId;
                convos:Convo[];
            }>){
                convoAdapter.upsertMany(state.rooms.entities[payload.roomID].convos,payload.convos)
            },

            // temp users
            updateChatUserStatus(state:Ichat,{payload}:PayloadAction<Update<User>>){
                userAdapter.updateOne(state.users,payload)
            },
        }
    }),
    chatRoomSelector = roomAdapter.getSelectors((state:ReduxState)=>state.chat.rooms),
    chatUserSelector = userAdapter.getSelectors((state:ReduxState)=>state.chat.users),
    chatConvoSelector = convoAdapter.getSelectors((room:Room)=>room.convos),
    chatRoomUserSelector = roomUserAdapter.getSelectors((room:Room)=>room.users)

export const {
    updateContextMenuID,
    
    chatRoomUpsertMany,
    updateChatRoomStatus,
    updateChatManyRoomStatus,
    updateChatRoomUserStatus,
    updateChatUserStatus,
    chatRoomFileInputSetAll,
    chatUserFileInputSetAll,
    chatRoomConvoUpdate,
    chatRoomConvoAddOne,
    chatRoomAddOne,
    chatRoomConvoUpsertMany,
} = chatSlice.actions
export type { Ichat }
export { 
    sliceName, 
    initialState,
    chatRoomSelector,
    // chatUserDetailsSelector,
    chatConvoSelector,
    chatRoomUserSelector,
    chatUserSelector,
}
export default chatSlice.reducer