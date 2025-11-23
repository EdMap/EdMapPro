/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * * `dev` - Software Engineer
 * * `dsgnr` - Designer
 * * `pm` - Project Manager
 * * `po` - Product Owner
 * * `mk` - Marketer
 * * `ds` - Data Scientist
 * * `cw` - Content Writer
 */
export enum CareerEnum {
    Dev = 'dev',
    Dsgnr = 'dsgnr',
    Pm = 'pm',
    Po = 'po',
    Mk = 'mk',
    Ds = 'ds',
    Cw = 'cw',
}
export interface ErrorDto {
    code?: string | null
    message?: string | null
    errors?: Record<string, any>[] | null
}
/**
 * * `male` - Male
 * * `female` - Female
 * * `other` - Other
 */
export enum GenderEnum {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}
export interface InterviewMessage {
    id: number
    text: string
    is_greeting?: boolean
    /**
     * * `user` - User
     * * `gpt` - GPT
     */
    message_owner_type: MessageOwnerTypeEnum
    question_reason?: string
}
export interface InterviewMessageDto {
    session: SessionDto
    message: InterviewMessage
}
/**
 * * `act` - Active
 * * `open` - Open to opportunities
 * * `stopped` - Not interested in any opportunities
 */
export enum JobSearchStageEnum {
    Act = 'act',
    Open = 'open',
    Stopped = 'stopped',
}
/**
 * * `user` - User
 * * `gpt` - GPT
 */
export enum MessageOwnerTypeEnum {
    User = 'user',
    Gpt = 'gpt',
}
export interface NegotiationMessage {
    id: number
    text: string
    is_greeting?: boolean
    /**
     * * `user` - User
     * * `gpt` - GPT
     */
    message_owner_type: MessageOwnerTypeEnum
}
export interface NegotiationMessageDto {
    session: NegotiationSessionResponse
    message: NegotiationMessage
}
export interface NegotiationSession {
    /** @maxLength 256 */
    session_id: string
    /** @format date-time */
    creation_date: string
    /**
     * * `started` - Started
     * * `done` - Done
     */
    session_status?: SessionStatusEnum
    negotiation_messages: NegotiationMessage[]
    initial_offer?: string
    offer?: string
}
export interface NegotiationSessionFeedbackDto {
    /** @maxLength 256 */
    session_id: string
    feedback?: string
    areas_for_improvement?: string
    offer?: string
}
export interface NegotiationSessionResponse {
    /** @maxLength 256 */
    session_id: string
    initial_offer?: string
    /**
     * * `started` - Started
     * * `done` - Done
     */
    session_status?: SessionStatusEnum
}
export interface PaginatedInterviewSessions {
    count: number
    /** @format uri */
    next?: string | null
    /** @format uri */
    previous?: string | null
    results: SimulationSessions[]
}
export interface PaginatedOfferNegotiationSessions {
    count: number
    /** @format uri */
    next?: string | null
    /** @format uri */
    previous?: string | null
    results: SimulationSessions[]
}
export interface SendMessageRequest {
    /** @format uuid */
    session_id: string
    message: string
}
/**
 * * `int` - Intern
 * * `jun` - Junior
 * * `mid` - Middle
 * * `snr` - Senior
 */
export enum SeniorityLevelEnum {
    Int = 'int',
    Jun = 'jun',
    Mid = 'mid',
    Snr = 'snr',
}
export interface Session {
    /** @maxLength 256 */
    session_id: string
    /** @format date-time */
    creation_date: string
    /**
     * * `started` - Started
     * * `done` - Done
     */
    session_status?: SessionStatusEnum
    interview_messages: InterviewMessage[]
    feedback?: string
    areas_for_improvement?: string
}
export interface SessionDto {
    /** @maxLength 256 */
    session_id: string
    /**
     * * `started` - Started
     * * `done` - Done
     */
    session_status?: SessionStatusEnum
}
export interface SessionFeedbackDto {
    /** @maxLength 256 */
    session_id: string
    feedback?: string
    areas_for_improvement?: string
}
export interface SessionRequest {
    /** @format uuid */
    session_id: string
}
export interface SessionResponse {
    /** @format uuid */
    session_id: string
}
/**
 * * `started` - Started
 * * `done` - Done
 */
export enum SessionStatusEnum {
    Started = 'started',
    Done = 'done',
}
export interface SimulationSessions {
    /** @maxLength 256 */
    session_id: string
    /** @format date-time */
    creation_date: string
    /**
     * * `started` - Started
     * * `done` - Done
     */
    session_status?: SessionStatusEnum
    /**
     * * `dev` - Software Engineer
     * * `dsgnr` - Designer
     * * `pm` - Project Manager
     * * `po` - Product Owner
     * * `mk` - Marketer
     * * `ds` - Data Scientist
     * * `cw` - Content Writer
     */
    career: CareerEnum
    /**
     * * `int` - Intern
     * * `jun` - Junior
     * * `mid` - Middle
     * * `snr` - Senior
     */
    seniority_level: SeniorityLevelEnum
}
export interface StartInterviewSessionRequest {
    company?: string
    job_description?: string
    /**
     * * `dev` - Software Engineer
     * * `dsgnr` - Designer
     * * `pm` - Project Manager
     * * `po` - Product Owner
     * * `mk` - Marketer
     * * `ds` - Data Scientist
     * * `cw` - Content Writer
     */
    career?: CareerEnum
    /**
     * * `int` - Intern
     * * `jun` - Junior
     * * `mid` - Middle
     * * `snr` - Senior
     */
    seniority_level?: SeniorityLevelEnum
}
export interface TokenRefresh {
    access: string
    refresh: string
}
export interface User {
    /** @format date-time */
    date_joined?: string
    /**
     * Email address
     * @format email
     * @maxLength 254
     */
    email?: string
    /** @maxLength 150 */
    first_name?: string
    get_full_name: string
    /** @maxLength 150 */
    last_name?: string
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     * @maxLength 150
     * @pattern ^[\w.@+-]+$
     */
    username: string
}
export interface UserLogin {
    username: string
    password: string
}
export interface UserProfile {
    user: User
    /** @format date */
    date_of_birth: string
    /**
     * * `dev` - Software Engineer
     * * `dsgnr` - Designer
     * * `pm` - Project Manager
     * * `po` - Product Owner
     * * `mk` - Marketer
     * * `ds` - Data Scientist
     * * `cw` - Content Writer
     */
    career: CareerEnum
    /**
     * * `int` - Intern
     * * `jun` - Junior
     * * `mid` - Middle
     * * `snr` - Senior
     */
    seniority_level: SeniorityLevelEnum
    /**
     * * `male` - Male
     * * `female` - Female
     * * `other` - Other
     */
    gender: GenderEnum
    /**
     * * `act` - Active
     * * `open` - Open to opportunities
     * * `stopped` - Not interested in any opportunities
     */
    job_search_stage: JobSearchStageEnum
}
export interface UserProfileUpdateDto {
    first_name: string
    last_name: string
    /**
     * * `dev` - Software Engineer
     * * `dsgnr` - Designer
     * * `pm` - Project Manager
     * * `po` - Product Owner
     * * `mk` - Marketer
     * * `ds` - Data Scientist
     * * `cw` - Content Writer
     */
    career: CareerEnum
    /**
     * * `int` - Intern
     * * `jun` - Junior
     * * `mid` - Middle
     * * `snr` - Senior
     */
    seniority_level: SeniorityLevelEnum
    /**
     * * `male` - Male
     * * `female` - Female
     * * `other` - Other
     */
    gender: GenderEnum
}
export interface UserRegistration {
    username: string
    /** @format email */
    email: string
    password: string
}
export interface UserTokenDto {
    user: User | null
    access: string | null
    refresh: string | null
}

import { ContentType, HttpClient, RequestParams } from '../features/api/models'

/**
 * @title Edmap API
 * @version 0.0.0
 *
 * Edmap's backend api
 */

export class Api<
    SecurityDataType extends unknown = unknown,
> extends HttpClient<SecurityDataType> {
    api = {
        /**
         * No description
         *
         * @tags api
         * @name ApiCsrfRetrieve
         * @request GET:/api/csrf/
         * @secure
         * @response `200` `void` No response body
         */
        apiCsrfRetrieve: (params: RequestParams = {}) =>
            this.request<void, any>({
                path: `/api/csrf/`,
                method: 'GET',
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags api
         * @name ApiSubscribersAddCreate
         * @request POST:/api/subscribers/add/
         * @secure
         * @response `200` `void` No response body
         */
        apiSubscribersAddCreate: (params: RequestParams = {}) =>
            this.request<void, any>({
                path: `/api/subscribers/add/`,
                method: 'POST',
                secure: true,
                ...params,
            }),
    }
    accounts = {
        /**
         * @description Login and obtain jwt tokens and user info
         *
         * @tags accounts
         * @name Login
         * @request POST:/api/v1.0/accounts/login/
         * @response `200` `UserTokenDto`
         * @response `401` `ErrorDto`
         */
        login: (data: UserLogin, params: RequestParams = {}) =>
            this.request<UserTokenDto, ErrorDto>({
                path: `/api/v1.0/accounts/login/`,
                method: 'POST',
                body: data,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags accounts
         * @name Profile
         * @request GET:/api/v1.0/accounts/profile/
         * @secure
         * @response `200` `UserProfile`
         */
        profile: (params: RequestParams = {}) =>
            this.request<UserProfile, any>({
                path: `/api/v1.0/accounts/profile/`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags accounts
         * @name ProfileUpdate
         * @request PUT:/api/v1.0/accounts/profile/
         * @secure
         * @response `200` `UserProfile`
         */
        profileUpdate: (
            data: UserProfileUpdateDto,
            params: RequestParams = {},
        ) =>
            this.request<UserProfile, any>({
                path: `/api/v1.0/accounts/profile/`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * @description Register a new user and receive JWT tokens
         *
         * @tags accounts
         * @name Register
         * @request POST:/api/v1.0/accounts/register/
         * @secure
         * @response `201` `UserTokenDto`
         * @response `400` `ErrorDto`
         */
        register: (data: UserRegistration, params: RequestParams = {}) =>
            this.request<UserTokenDto, ErrorDto>({
                path: `/api/v1.0/accounts/register/`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * @description Takes a refresh type JSON web token and returns an access type JSON web token if the refresh token is valid.
         *
         * @tags accounts
         * @name Refresh
         * @request POST:/api/v1.0/accounts/token/refresh/
         * @response `200` `TokenRefresh`
         * @response `401` `ErrorDto`
         */
        refresh: (data: TokenRefresh, params: RequestParams = {}) =>
            this.request<TokenRefresh, ErrorDto>({
                path: `/api/v1.0/accounts/token/refresh/`,
                method: 'POST',
                body: data,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),
    }
    interviewSimulation = {
        /**
         * No description
         *
         * @tags interview_simulation
         * @name GreetCandidate
         * @request POST:/api/v1.0/interview_simulation/greet_candidate
         * @secure
         * @response `200` `InterviewMessageDto`
         * @response `500` `ErrorDto`
         */
        greetCandidate: (data: SessionRequest, params: RequestParams = {}) =>
            this.request<InterviewMessageDto, ErrorDto>({
                path: `/api/v1.0/interview_simulation/greet_candidate`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name GetSessionHistory
         * @request GET:/api/v1.0/interview_simulation/interview_session/
         * @secure
         * @response `200` `Session`
         */
        getSessionHistory: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<Session, any>({
                path: `/api/v1.0/interview_simulation/interview_session/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name StartSession
         * @request POST:/api/v1.0/interview_simulation/interview_session/
         * @secure
         * @response `200` `SessionResponse`
         */
        startSession: (
            data: StartInterviewSessionRequest,
            params: RequestParams = {},
        ) =>
            this.request<SessionResponse, any>({
                path: `/api/v1.0/interview_simulation/interview_session/`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name GetSessionFeedback
         * @request GET:/api/v1.0/interview_simulation/interview_session_feedback/
         * @secure
         * @response `200` `SessionFeedbackDto`
         * @response `500` `ErrorDto`
         */
        getSessionFeedback: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<SessionFeedbackDto, ErrorDto>({
                path: `/api/v1.0/interview_simulation/interview_session_feedback/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name GenerateSessionFeedback
         * @request PUT:/api/v1.0/interview_simulation/interview_session_feedback/
         * @secure
         * @response `400` `ErrorDto`
         * @response `500` `ErrorDto`
         */
        generateSessionFeedback: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<any, ErrorDto>({
                path: `/api/v1.0/interview_simulation/interview_session_feedback/`,
                method: 'PUT',
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name SendMessage
         * @request POST:/api/v1.0/interview_simulation/message_interview/
         * @secure
         * @response `200` `InterviewMessageDto`
         * @response `500` `ErrorDto`
         */
        sendMessage: (data: SendMessageRequest, params: RequestParams = {}) =>
            this.request<InterviewMessageDto, ErrorDto>({
                path: `/api/v1.0/interview_simulation/message_interview/`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags interview_simulation
         * @name GetInterviewSessions
         * @request GET:/api/v1.0/interview_simulation/sessions/
         * @secure
         * @response `200` `PaginatedInterviewSessions`
         */
        getInterviewSessions: (
            query?: {
                /** @default 25 */
                limit?: number
                /** @default 0 */
                offset?: number
            },
            params: RequestParams = {},
        ) =>
            this.request<PaginatedInterviewSessions, any>({
                path: `/api/v1.0/interview_simulation/sessions/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    }
    offerNegotiationSimulation = {
        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name GreetNegotiationCandidate
         * @request POST:/api/v1.0/offer_negotiation_simulation/greet_candidate
         * @secure
         * @response `200` `NegotiationMessageDto`
         * @response `500` `ErrorDto`
         */
        greetNegotiationCandidate: (
            data: SessionRequest,
            params: RequestParams = {},
        ) =>
            this.request<NegotiationMessageDto, ErrorDto>({
                path: `/api/v1.0/offer_negotiation_simulation/greet_candidate`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name SendNegotiationMessage
         * @request POST:/api/v1.0/offer_negotiation_simulation/message_offer/
         * @secure
         * @response `200` `NegotiationMessageDto`
         * @response `500` `ErrorDto`
         */
        sendNegotiationMessage: (
            data: SendMessageRequest,
            params: RequestParams = {},
        ) =>
            this.request<NegotiationMessageDto, ErrorDto>({
                path: `/api/v1.0/offer_negotiation_simulation/message_offer/`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name GetNegotiationSessionFeedback
         * @request GET:/api/v1.0/offer_negotiation_simulation/negotiation_session_feedback/
         * @secure
         * @response `200` `NegotiationSessionFeedbackDto`
         * @response `500` `ErrorDto`
         */
        getNegotiationSessionFeedback: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<NegotiationSessionFeedbackDto, ErrorDto>({
                path: `/api/v1.0/offer_negotiation_simulation/negotiation_session_feedback/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name GenerateOfferNegotiationFeedback
         * @request PUT:/api/v1.0/offer_negotiation_simulation/negotiation_session_feedback/
         * @secure
         * @response `400` `ErrorDto`
         * @response `500` `ErrorDto`
         */
        generateOfferNegotiationFeedback: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<any, ErrorDto>({
                path: `/api/v1.0/offer_negotiation_simulation/negotiation_session_feedback/`,
                method: 'PUT',
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name GetNegotiationSessionHistory
         * @request GET:/api/v1.0/offer_negotiation_simulation/offer_negotiation_session/
         * @secure
         * @response `200` `NegotiationSession`
         */
        getNegotiationSessionHistory: (
            query: {
                /** @format uuid */
                session_id: string
            },
            params: RequestParams = {},
        ) =>
            this.request<NegotiationSession, any>({
                path: `/api/v1.0/offer_negotiation_simulation/offer_negotiation_session/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name StartNegotiationSession
         * @request POST:/api/v1.0/offer_negotiation_simulation/offer_negotiation_session/
         * @secure
         * @response `200` `NegotiationSessionResponse`
         */
        startNegotiationSession: (params: RequestParams = {}) =>
            this.request<NegotiationSessionResponse, any>({
                path: `/api/v1.0/offer_negotiation_simulation/offer_negotiation_session/`,
                method: 'POST',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags offer_negotiation_simulation
         * @name GetNegotiationSessions
         * @request GET:/api/v1.0/offer_negotiation_simulation/sessions/
         * @secure
         * @response `200` `PaginatedOfferNegotiationSessions`
         */
        getNegotiationSessions: (
            query?: {
                /** @default 25 */
                limit?: number
                /** @default 0 */
                offset?: number
            },
            params: RequestParams = {},
        ) =>
            this.request<PaginatedOfferNegotiationSessions, any>({
                path: `/api/v1.0/offer_negotiation_simulation/sessions/`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    }
}
