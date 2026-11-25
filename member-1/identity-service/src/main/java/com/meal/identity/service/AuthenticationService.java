package com.meal.identity.service;

import com.meal.contract.dto.ProfileCreationRequest;
import com.meal.contract.constant.RoleDefine;
import com.meal.identity.dto.request.*;
import com.meal.identity.dto.response.AuthenticationResponse;
import com.meal.identity.dto.response.IntrospectResponse;
import com.meal.identity.dto.response.OutboundUserResponse;
import com.meal.identity.entity.InvalidateToken;
import com.meal.identity.entity.Role;
import com.meal.identity.entity.User;
import com.meal.identity.exception.AppException;
import com.meal.identity.exception.ErrorCode;
import com.meal.identity.repository.InvalidateTokenRepository;
import com.meal.identity.repository.RoleRepository;
import com.meal.identity.repository.UserRepository;
import com.meal.identity.repository.httpclient.OutboundIdentityClient;
import com.meal.identity.repository.httpclient.OutboundUserClient;
import com.meal.identity.repository.httpclient.ProfileClient;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationService {

    @Value("${jwt.signer-key}")
    private String SIGN_KEY;

    @Value("${jwt.refreshable-duration}")
    private int REFRESHABLE_DURATION;

    @Value("${jwt.valid-duration}")
    private int VALIDATION_DURATION;

    @Value("${outbound.identity.client-id}")
    private String CLIENT_ID;

    @Value("${outbound.identity.client-secret}")
    private String CLIENT_SECRET;

    @Value("${outbound.identity.redirect-uri}")
    private String REDIRECT_URI;

    @NonFinal
    private static final String GRANT_TYPE = "authorization_code";

    @NonFinal
    private static final String ISSUER = "huumod.com";

    final PasswordEncoder passwordEncoder;
    final UserRepository userRepository;
    final InvalidateTokenRepository invalidateTokenRepository;
    final OutboundIdentityClient outboundIdentityClient;
    final OutboundUserClient outboundUserClient;
    final ProfileClient profileClient;
    final RoleRepository roleRepository;
    final LoginAttemptService loginAttemptService;

    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        }catch (Exception e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse outboundAuthenticate(String code) {
        var response = outboundIdentityClient.token(ExchangeTokenRequest.builder()
                .code(code)
                .clientId(CLIENT_ID)
                .clientSecret(CLIENT_SECRET)
                .redirectUri(REDIRECT_URI)
                .grantType(GRANT_TYPE)
                .build());

        var userInfo = outboundUserClient.getUserInfo("json", response.getAccessToken());

        User user = userRepository.findByEmail(userInfo.getEmail())
                .orElse(null);

        if (Objects.isNull(user)) {
            user = createUser(userInfo);

            profileClient.create(ProfileCreationRequest.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .dob(user.getBirthday())
                    .avatar(userInfo.getPicture())
                    .build());
        }

        String token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    private User createUser(OutboundUserResponse userInfo) {
        Role userRole = roleRepository.findById(RoleDefine.USER.name())
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleDefine.USER.name()).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        return userRepository.save(User.builder()
                .username(userInfo.getEmail())
                .email(userInfo.getEmail())
                .firstName(userInfo.getGivenName())
                .lastName(userInfo.getFamilyName())
                .roles(roles)
                .build());
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String username = request.getUsername();

        if (loginAttemptService.getLockRemainingSeconds(username) > 0) {
            throw new AppException(ErrorCode.TOO_MANY_ATTEMPTS);
        }

        User user = (username.contains("@")
                ? userRepository.findByEmail(username)
                : userRepository.findByUsername(username)).orElse(null);

        boolean authenticated = Objects.nonNull(user)
                && StringUtils.hasText(user.getPassword())
                && passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            loginAttemptService.recordFailure(username);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        loginAttemptService.recordSuccess(username);
        return AuthenticationResponse.builder()
                .token(generateToken(user))
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        SignedJWT signedJWT = verifyToken(request.getToken(), true);

        String jti = signedJWT.getJWTClaimsSet().getJWTID();
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        InvalidateToken invalidateToken = InvalidateToken.builder()
                .token(jti)
                .expireTime(expiryTime)
                .build();

        invalidateTokenRepository.save(invalidateToken);

        String userId = signedJWT.getJWTClaimsSet().getSubject();

        var user = userRepository.findById(userId).orElseThrow(
                () -> new AppException(ErrorCode.UNAUTHENTICATED));

        String token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    public void logout(LogoutRequest request) {
        try {
            SignedJWT signedJWT = verifyToken(request.getToken(), true);

            String jti = signedJWT.getJWTClaimsSet().getJWTID();
            Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            InvalidateToken invalidateToken = InvalidateToken.builder()
                    .token(jti)
                    .expireTime(expiryTime)
                    .build();

            invalidateTokenRepository.save(invalidateToken);
        } catch (AppException | ParseException e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    public String generateToken(User user) {
        JWSHeader header = new JWSHeader(new JWSAlgorithm("HS256"));

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer(ISSUER)
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now()
                        .plus(VALIDATION_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .claim("scope", buildScope(user))
                .jwtID(UUID.randomUUID().toString())
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGN_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    public SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);

        if (!signedJWT.verify(new MACVerifier(SIGN_KEY.getBytes(StandardCharsets.UTF_8))))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        if (!ISSUER.equals(claims.getIssuer()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        Date expiryTime = isRefresh
                ? Date.from(claims.getIssueTime().toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS))
                : claims.getExpirationTime();

        if (Objects.isNull(expiryTime) || !expiryTime.after(new Date()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidateTokenRepository.existsById(claims.getJWTID()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(", ");

        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions()))
                    role.getPermissions().forEach(permission ->
                            stringJoiner.add(permission.getName()));
            });

        return stringJoiner.toString();
    }
}
