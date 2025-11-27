package com.ecommerce.klu.controller;

import com.ecommerce.klu.service.SseEmitterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "http://localhost:5173")
public class StreamController {

    @Autowired
    private SseEmitterService sseEmitterService;

    @GetMapping("/orders")
    public SseEmitter streamOrders() {
        return sseEmitterService.createEmitter();
    }
}
