package com.meal.identity.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public enum ErrorCode {

    UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNCATEGORIZED(9999, "Uncategorized", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND(1002, "User not found", HttpStatus.NOT_FOUND),
    USER_EXIST(1003, "User already exist", HttpStatus.CONFLICT),
    USER_NOT_CREATED(1004, "User not created", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1005, "Invalid key", HttpStatus.BAD_REQUEST),
    ;

    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;
}
